const { ipcRenderer } = require('electron');

class WiFiTriangulationApp {
    constructor() {
        this.networks = [];
        this.devices = [];
        this.accessPoints = [];
        this.automations = [];
        this.currentView = 'dashboard';
        this.currentFloor = 1;
        this.canvas = null;
        this.ctx = null;
        this.floorPlanImage = null;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        
        this.init();
    }

    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        const str = String(unsafe);
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.updateStatus('Initializing...', 'connecting');
        
        await this.loadInitialData();
        this.updateStatus('Ready', 'connected');
        
        this.startPeriodicUpdates();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Network scanning
        document.getElementById('scan-btn').addEventListener('click', () => {
            this.scanNetworks();
        });

        // Manual network entry
        document.getElementById('manual-network-btn').addEventListener('click', () => {
            this.showManualNetworkEntry();
        });

        document.getElementById('cancel-manual').addEventListener('click', () => {
            this.hideManualNetworkEntry();
        });

        document.getElementById('save-manual-networks').addEventListener('click', () => {
            this.saveManualNetworks();
        });

        document.getElementById('add-network-entry').addEventListener('click', () => {
            this.addNetworkEntry();
        });

        // Device refresh
        document.getElementById('refresh-devices').addEventListener('click', () => {
            this.refreshDevices();
        });

        // Floor plan controls
        document.querySelectorAll('.floor-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchFloor(parseInt(e.target.dataset.floor));
            });
        });

        document.getElementById('upload-floorplan').addEventListener('click', () => {
            document.getElementById('floorplan-upload').click();
        });

        document.getElementById('floorplan-upload').addEventListener('change', (e) => {
            this.loadFloorPlan(e.target.files[0]);
        });

        document.getElementById('zoom-in').addEventListener('click', () => {
            this.zoom = Math.min(this.zoom * 1.2, 3);
            this.drawFloorPlan();
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
            this.zoom = Math.max(this.zoom / 1.2, 0.5);
            this.drawFloorPlan();
        });

        // Automation
        document.getElementById('add-automation').addEventListener('click', () => {
            this.showAutomationModal();
        });

        document.getElementById('cancel-automation').addEventListener('click', () => {
            this.hideAutomationModal();
        });

        document.getElementById('automation-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAutomation();
        });

        // Automation deletion (Event Delegation)
        const automationRules = document.getElementById('automation-rules');
        if (automationRules) {
            automationRules.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-automation-btn')) {
                    const id = e.target.dataset.id;
                    if (id) {
                        this.deleteAutomation(id);
                    }
                }
            });
        }

        // Smart device testing
        document.querySelectorAll('.test-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.testSmartDevice(e.target.dataset.device);
            });
        });

        // Settings
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Intelligent Setup
        document.getElementById('start-intelligent-setup').addEventListener('click', () => {
            this.startIntelligentSetup();
        });

        document.getElementById('cancel-setup').addEventListener('click', () => {
            this.hideIntelligentSetup();
        });

        document.getElementById('continue-setup').addEventListener('click', () => {
            this.continueIntelligentSetup();
        });

        document.getElementById('mark-location').addEventListener('click', () => {
            this.markCurrentLocation();
        });
    }

    setupCanvas() {
        this.canvas = document.getElementById('floorplan-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });

        let animationFrameId = null;
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom = Math.max(0.5, Math.min(3, this.zoom * delta));

            // ⚡ Bolt: Use requestAnimationFrame to debounce redraws during scrolling
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(() => {
                    this.drawFloorPlan();
                    animationFrameId = null;
                });
            }
        });
    }

    switchView(viewName) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.removeAttribute('aria-current');
        });
        const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-current', 'page');

        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');

        this.currentView = viewName;

        if (viewName === 'floorplan') {
            setTimeout(() => this.drawFloorPlan(), 100);
        }
    }

    switchFloor(floor) {
        this.currentFloor = floor;
        document.querySelectorAll('.floor-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-floor="${floor}"]`).classList.add('active');
        this.drawFloorPlan();
    }

    async loadInitialData() {
        // ⚡ Bolt: Parallelize data loading to reduce startup time
        await Promise.all([
            this.scanNetworks(),
            this.refreshDevices(),
            this.loadAutomations(),
            this.loadSettings()
        ]);
        // Ensure consistent initial state
        this.drawFloorPlan();
    }

    async scanNetworks() {
        this.updateStatus('Scanning networks...', 'connecting');
        
        try {
            this.networks = await ipcRenderer.invoke('scan-wifi');
            this.accessPoints = await ipcRenderer.invoke('get-access-points');
            
            this.updateNetworkDisplay();
            this.updateAccessPointsDisplay();
            this.updateDashboard();
            
            this.updateStatus('Networks scanned', 'connected');
        } catch (error) {
            console.error('Network scan failed:', error);
            this.updateStatus('Scan failed', 'error');
        }
    }

    async refreshDevices() {
        try {
            this.devices = await ipcRenderer.invoke('get-devices');
            const devicePositions = await ipcRenderer.invoke('get-device-positions');
            
            this.updateDeviceDisplay();
            this.updateDevicePositions(devicePositions);
            this.updateDashboard();
            this.drawFloorPlan();
        } catch (error) {
            console.error('Device refresh failed:', error);
        }
    }

    updateNetworkDisplay() {
        const container = document.getElementById('wifi-networks');
        
        if (this.networks.length === 0) {
            container.innerHTML = '<p class="loading">No networks found</p>';
            return;
        }

        container.innerHTML = this.networks.map(network => `
            <div class="network-item">
                <div class="network-info">
                    <div class="network-name">${this.escapeHtml(network.ssid || 'Hidden Network')}</div>
                    <div class="network-details">
                        ${this.escapeHtml(network.bssid)} • ${network.frequency}MHz
                    </div>
                </div>
                <div class="signal-strength">
                    <span>${network.signal_level}dBm</span>
                    ${this.renderSignalBars(network.signal_level)}
                </div>
            </div>
        `).join('');
    }

    updateAccessPointsDisplay() {
        const container = document.getElementById('ap-positions');
        
        container.innerHTML = this.accessPoints.map(ap => `
            <div class="network-item">
                <div class="network-info">
                    <div class="network-name">${this.escapeHtml(ap.ssid || 'Access Point')}</div>
                    <div class="network-details">
                        Floor ${ap.position?.floor || 1} • Position: (${ap.position?.x || 0}, ${ap.position?.y || 0})
                    </div>
                </div>
                <div class="signal-strength">
                    <span>${ap.signal_level}dBm</span>
                </div>
            </div>
        `).join('');
    }

    updateDeviceDisplay() {
        const container = document.getElementById('tracked-devices');
        
        if (this.devices.length === 0) {
            container.innerHTML = '<p class="loading">No devices detected</p>';
            return;
        }

        container.innerHTML = this.devices.map(device => `
            <div class="device-item">
                <div class="device-info">
                    <div class="device-name">${this.escapeHtml(device.tag || device.mac)}</div>
                    <div class="device-details">
                        ${this.escapeHtml(device.mac)} • Last seen: ${new Date(device.lastSeen).toLocaleTimeString()}
                    </div>
                </div>
                <div class="signal-strength">
                    <span>RSSI: ${device.rssi?.join(', ') || 'N/A'}</span>
                </div>
            </div>
        `).join('');

        this.updateDeviceTagging();
    }

    updateDeviceTagging() {
        const container = document.getElementById('device-tags');
        
        container.innerHTML = this.devices.map(device => `
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px;">${this.escapeHtml(device.mac)}:</label>
                <input type="text" 
                       value="${this.escapeHtml(device.tag || '')}"
                       placeholder="Enter device name (e.g., John's Phone)"
                       data-mac="${this.escapeHtml(device.mac)}"
                       style="width: 100%; padding: 6px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: #f1f5f9;">
            </div>
        `).join('');

        // Add event listeners for tag inputs
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('blur', async () => {
                const tags = {};
                container.querySelectorAll('input').forEach(inp => {
                    if (inp.value.trim()) {
                        tags[inp.dataset.mac] = inp.value.trim();
                    }
                });
                await ipcRenderer.invoke('save-device-tags', tags);
            });
        });
    }

    renderSignalBars(signalLevel) {
        const strength = Math.max(0, Math.min(4, Math.floor((signalLevel + 100) / 12.5)));
        let bars = '<div class="signal-bars">';
        
        for (let i = 0; i < 4; i++) {
            bars += `<div class="signal-bar ${i < strength ? 'active' : ''}"></div>`;
        }
        
        bars += '</div>';
        return bars;
    }

    loadFloorPlan(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.floorPlanImage = img;
                this.drawFloorPlan();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    drawFloorPlan() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw floor plan image if loaded
        if (this.floorPlanImage) {
            const scale = Math.min(
                this.canvas.width / this.floorPlanImage.width,
                this.canvas.height / this.floorPlanImage.height
            ) * this.zoom;
            
            const x = (this.canvas.width - this.floorPlanImage.width * scale) / 2 + this.panX;
            const y = (this.canvas.height - this.floorPlanImage.height * scale) / 2 + this.panY;
            
            this.ctx.drawImage(this.floorPlanImage, x, y, 
                this.floorPlanImage.width * scale, 
                this.floorPlanImage.height * scale);
        }
        
        // Draw access points
        this.accessPoints.forEach(ap => {
            if (ap.position?.floor === this.currentFloor) {
                this.drawAccessPoint(ap.position.x * this.zoom, ap.position.y * this.zoom, ap.ssid);
            }
        });
        
        // Draw devices
        this.devices.forEach(device => {
            if (device.position?.floor === this.currentFloor) {
                this.drawDevice(device.position.x * this.zoom, device.position.y * this.zoom, device.tag || device.mac);
            }
        });
    }

    drawAccessPoint(x, y, label) {
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#f1f5f9';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText(label || 'AP', x + 12, y + 4);
    }

    drawDevice(x, y, label) {
        this.ctx.fillStyle = '#10b981';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#f1f5f9';
        this.ctx.font = '10px sans-serif';
        this.ctx.fillText(label || 'Device', x + 10, y + 3);
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Handle AP positioning or device interaction
        console.log(`Canvas clicked at: ${x}, ${y}`);
    }

    async loadAutomations() {
        try {
            this.automations = await ipcRenderer.invoke('get-automations');
            this.updateAutomationDisplay();
        } catch (error) {
            console.error('Failed to load automations:', error);
        }
    }

    updateAutomationDisplay() {
        const container = document.getElementById('automation-rules');
        
        if (this.automations.length === 0) {
            container.innerHTML = '<p class="loading">No automation rules configured</p>';
            return;
        }

        container.innerHTML = this.automations.map(automation => `
            <div class="automation-item">
                <div class="device-info">
                    <div class="device-name">${this.escapeHtml(automation.name)}</div>
                    <div class="device-details">
                        ${this.escapeHtml(automation.trigger)} • ${this.escapeHtml(automation.type)} • ${this.escapeHtml(automation.zone || 'Any zone')}
                    </div>
                </div>
                <button class="btn-secondary delete-automation-btn" data-id="${this.escapeHtml(automation.id)}">Delete</button>
            </div>
        `).join('');
    }

    showAutomationModal() {
        // Populate person dropdown
        const personSelect = document.getElementById('trigger-person');
        personSelect.innerHTML = '<option value="">Select person...</option>' +
            this.devices.map(device => 
                `<option value="${this.escapeHtml(device.mac)}">${this.escapeHtml(device.tag || device.mac)}</option>`
            ).join('');
        
        document.getElementById('automation-modal').classList.add('active');
    }

    hideAutomationModal() {
        document.getElementById('automation-modal').classList.remove('active');
    }

    async createAutomation() {
        const automation = {
            id: Date.now().toString(),
            name: document.getElementById('rule-name').value,
            person: document.getElementById('trigger-person').value,
            zone: document.getElementById('trigger-zone').value,
            type: document.getElementById('action-type').value,
            trigger: 'enter'
        };

        await ipcRenderer.invoke('save-automation', automation);
        await this.loadAutomations();
        this.hideAutomationModal();
    }

    async deleteAutomation(id) {
        if (!confirm('Are you sure you want to delete this automation?')) {
            return;
        }

        try {
            // Note: The backend handler 'delete-automation' needs to be implemented in main.js
            // This is a secure implementation on the renderer side.
            await ipcRenderer.invoke('delete-automation', id);
            await this.loadAutomations();
        } catch (error) {
            console.error('Failed to delete automation:', error);
            this.showNotification('Failed to delete automation', 'error');
        }
    }

    async testSmartDevice(deviceType) {
        try {
            const result = await ipcRenderer.invoke('test-smart-device', deviceType, 'test');
            if (result) {
                this.showNotification(`${deviceType.toUpperCase()} test successful!`);
            } else {
                this.showNotification(`${deviceType.toUpperCase()} test failed!`, 'error');
            }
        } catch (error) {
            this.showNotification(`${deviceType.toUpperCase()} test error!`, 'error');
        }
    }

    async saveSettings() {
        const settings = {
            geminiApiKey: document.getElementById('gemini-api-key').value,
            pathLoss: parseFloat(document.getElementById('path-loss').value),
            refPower: parseInt(document.getElementById('ref-power').value),
            homebridgeIp: document.getElementById('homebridge-ip').value,
            homebridgePort: parseInt(document.getElementById('homebridge-port').value),
            homebridgeUsername: document.getElementById('homebridge-username').value,
            homebridgePassword: document.getElementById('homebridge-password').value,
            homebridgePin: document.getElementById('homebridge-pin').value
        };

        try {
            await ipcRenderer.invoke('save-settings', settings);
            this.showNotification('Settings saved successfully!');
            
            // Update Gemini status
            if (settings.geminiApiKey) {
                document.getElementById('gemini-status').textContent = '✅ Gemini AI initialized and ready for intelligent setup';
                document.getElementById('gemini-status').style.color = '#10b981';
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showNotification('Failed to save settings!', 'error');
        }
    }

    async loadSettings() {
        try {
            const settings = await ipcRenderer.invoke('load-settings');
            
            if (settings.geminiApiKey) document.getElementById('gemini-api-key').value = settings.geminiApiKey;
            if (settings.pathLoss) document.getElementById('path-loss').value = settings.pathLoss;
            if (settings.refPower) document.getElementById('ref-power').value = settings.refPower;
            if (settings.homebridgeIp) document.getElementById('homebridge-ip').value = settings.homebridgeIp;
            if (settings.homebridgePort) document.getElementById('homebridge-port').value = settings.homebridgePort;
            if (settings.homebridgeUsername) document.getElementById('homebridge-username').value = settings.homebridgeUsername;
            if (settings.homebridgePassword) document.getElementById('homebridge-password').value = settings.homebridgePassword;
            if (settings.homebridgePin) document.getElementById('homebridge-pin').value = settings.homebridgePin;
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    updateDashboard() {
        // ⚡ Bolt: Debounce dashboard updates to prevent redundant DOM operations
        if (this._dashboardUpdateTimeout) clearTimeout(this._dashboardUpdateTimeout);
        this._dashboardUpdateTimeout = setTimeout(() => {
            this._performUpdateDashboard();
        }, 50);
    }

    _performUpdateDashboard() {
        // Network status
        const networkStatus = document.getElementById('network-status');
        if (networkStatus) {
            networkStatus.innerHTML = `
                <p>${this.networks.length} networks detected</p>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                    Last scan: ${new Date().toLocaleTimeString()}
                </p>
            `;
        }

        // Device count
        const deviceCount = document.querySelector('#device-count .count');
        if (deviceCount) {
            deviceCount.textContent = this.devices.length;
        }

        // Access points
        const apStatus = document.getElementById('ap-status');
        if (apStatus) {
            apStatus.innerHTML = `
                <p>${this.accessPoints.length} access points configured</p>
                ${this.accessPoints.map(ap => `
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                        ${this.escapeHtml(ap.ssid || 'Unknown')} (${ap.signal_level}dBm)
                    </div>
                `).join('')}
            `;
        }

        // Automation status
        const automationStatus = document.getElementById('automation-status');
        if (automationStatus) {
            automationStatus.innerHTML = `
                <p>${this.automations.length} rules active</p>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                    Gemini AI ${this.geminiEnabled ? 'enabled' : 'disabled'}
                </p>
            `;
        }
    }

    updateDevicePositions(devicePositions) {
        devicePositions.forEach(devicePos => {
            const device = this.devices.find(d => d.mac === devicePos.mac);
            if (device) {
                device.position = devicePos.position;
                device.tag = devicePos.tag;
            }
        });
    }

    updateStatus(text, type = 'connecting') {
        const statusText = document.getElementById('status-text');
        const statusDot = document.getElementById('status-dot');
        
        statusText.textContent = text;
        statusDot.className = `status-dot ${type}`;
    }

    showNotification(message, type = 'success') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1001;
            font-size: 14px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    startPeriodicUpdates() {
        // Refresh data every 30 seconds
        setInterval(() => {
            if (this.currentView === 'dashboard' || this.currentView === 'devices') {
                this.refreshDevices();
            }
            if (this.currentView === 'network' || this.currentView === 'dashboard') {
                this.scanNetworks();
            }
        }, 30000);

        // ⚡ Bolt: Removed redundant 5-second floor plan redraw loop.
        // Redraw is now event-driven by refreshDevices() and user interactions.

        // Listen for Gemini improvements
        ipcRenderer.on('gemini-improvements', (event, improvements) => {
            this.applyGeminiImprovements(improvements);
        });
    }

    // Intelligent Setup Methods
    async startIntelligentSetup() {
        try {
            const response = await ipcRenderer.invoke('start-intelligent-setup');
            if (response) {
                this.showIntelligentSetup(response);
            } else {
                this.showNotification('Please configure Gemini API key first!', 'error');
            }
        } catch (error) {
            console.error('Failed to start intelligent setup:', error);
            this.showNotification('Failed to start intelligent setup!', 'error');
        }
    }

    showIntelligentSetup(response) {
        document.getElementById('setup-message').textContent = response.message;
        document.getElementById('setup-instructions').textContent = response.instructions;
        document.getElementById('intelligent-setup-modal').classList.add('active');
        
        if (response.nextStep === 'walking_setup') {
            document.getElementById('walking-controls').style.display = 'block';
        }
    }

    hideIntelligentSetup() {
        document.getElementById('intelligent-setup-modal').classList.remove('active');
    }

    async continueIntelligentSetup() {
        try {
            const response = await ipcRenderer.invoke('process-user-action', 'continue', {
                currentStep: 'user_continued'
            });
            
            if (response) {
                this.showIntelligentSetup(response);
                this.updateSetupProgress();
            }
        } catch (error) {
            console.error('Continue setup failed:', error);
        }
    }

    async markCurrentLocation() {
        const deviceType = document.getElementById('device-type-select').value;
        const setupCodes = document.getElementById('setup-codes').value;
        
        if (!deviceType) {
            this.showNotification('Please select a device type!', 'error');
            return;
        }

        // Get current position (mock for now - would use actual positioning)
        const position = {
            x: Math.random() * 800,
            y: Math.random() * 600,
            floor: this.currentFloor,
            timestamp: Date.now()
        };

        try {
            const response = await ipcRenderer.invoke('walking-setup', position, deviceType, setupCodes);
            
            if (response) {
                this.showNotification(`${deviceType} mapped successfully!`);
                
                // Update floor plan
                if (response.floorplanUpdate) {
                    this.drawFloorPlan();
                }
                
                // Show next instructions
                if (response.nextInstructions) {
                    document.getElementById('setup-instructions').textContent = response.nextInstructions;
                }
                
                // Clear form
                document.getElementById('device-type-select').value = '';
                document.getElementById('setup-codes').value = '';
                
                this.updateSetupProgress();
            }
        } catch (error) {
            console.error('Mark location failed:', error);
            this.showNotification('Failed to mark location!', 'error');
        }
    }

    async updateSetupProgress() {
        try {
            const progress = await ipcRenderer.invoke('get-setup-progress');
            if (progress) {
                const percentage = progress.totalDevices > 0 ? 
                    (progress.devicesConfigured / progress.totalDevices) * 100 : 0;
                
                document.getElementById('progress-bar').style.width = `${percentage}%`;
                document.getElementById('progress-text').textContent = 
                    `${progress.devicesConfigured} of ${progress.totalDevices} devices configured`;
            }
        } catch (error) {
            console.error('Update progress failed:', error);
        }
    }

    async applyGeminiImprovements(improvements) {
        console.log('Applying Gemini improvements:', improvements);
        
        // Apply UI improvements
        if (improvements.improvements) {
            improvements.improvements.forEach(improvement => {
                this.showNotification(`🧠 Gemini suggests: ${improvement}`);
            });
        }
        
        // This would apply actual UI changes based on Gemini's suggestions
        // For now, just show notifications
    }

    // Manual Network Entry Methods
    showManualNetworkEntry() {
        document.getElementById('manual-network-modal').classList.add('active');
    }

    hideManualNetworkEntry() {
        document.getElementById('manual-network-modal').classList.remove('active');
    }

    addNetworkEntry() {
        const container = document.getElementById('manual-networks');
        const entry = document.createElement('div');
        entry.className = 'manual-network-entry';
        entry.innerHTML = `
            <label>
                Network Name (SSID):
                <input type="text" class="manual-ssid" placeholder="Network name">
            </label>
            <label>
                Location:
                <select class="manual-location">
                    <option value="1">Floor 1</option>
                    <option value="2">Floor 2</option>
                    <option value="3">Floor 3</option>
                </select>
            </label>
            <label>
                Device Type:
                <select class="manual-type">
                    <option value="router">Main Router</option>
                    <option value="pod">WiFi Pod/Extender</option>
                    <option value="repeater">Repeater</option>
                </select>
            </label>
            <button class="btn-secondary" onclick="this.parentElement.remove()" style="margin-top: 8px;">Remove</button>
        `;
        container.appendChild(entry);
    }

    async saveManualNetworks() {
        const entries = document.querySelectorAll('.manual-network-entry');
        const networks = [];
        
        entries.forEach((entry, index) => {
            const ssid = entry.querySelector('.manual-ssid').value.trim();
            const location = entry.querySelector('.manual-location').value;
            const type = entry.querySelector('.manual-type').value;
            
            if (ssid) {
                networks.push({
                    ssid: ssid,
                    bssid: `00:11:22:33:44:${(55 + index).toString(16).padStart(2, '0')}`, // Generate fake MAC
                    signal_level: -45 - (index * 5), // Simulate different signal strengths
                    frequency: 2437,
                    floor: parseInt(location),
                    type: type,
                    manual: true
                });
            }
        });
        
        if (networks.length > 0) {
            // Update the networks display
            this.networks = networks;
            this.accessPoints = networks;
            this.updateNetworkDisplay();
            this.updateAccessPointsDisplay();
            this.updateDashboard();
            
            this.showNotification(`${networks.length} networks added manually!`);
            this.hideManualNetworkEntry();
        } else {
            this.showNotification('Please enter at least one network name!', 'error');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WiFiTriangulationApp();
});

if (typeof module !== 'undefined') {
    module.exports = WiFiTriangulationApp;
}
