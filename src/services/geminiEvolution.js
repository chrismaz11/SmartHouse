const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

class GeminiEvolutionEngine {
  constructor() {
    this.geminiClient = null;
    this.setupMode = false;
    this.currentSetupStep = null;
    this.userContext = {};
    this.deviceSetupQueue = [];
    this.evolutionHistory = [];
  }

  async initialize(apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.geminiClient = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Load evolution history
      await this.loadEvolutionHistory();
      
      console.log('Gemini Evolution Engine initialized');
      return true;
    } catch (error) {
      console.error('Gemini initialization failed:', error);
      return false;
    }
  }

  safeParseJSON(text) {
    if (!text) throw new Error('Empty response');
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanText);
  }

  async startIntelligentSetup() {
    if (!this.geminiClient) return false;

    this.setupMode = true;
    this.currentSetupStep = 'welcome';

    const setupPrompt = `You are now the intelligent setup assistant for a WiFi triangulation smart home system. 
    
    Your capabilities:
    - Guide users through device setup by having them walk around
    - Map router and device locations in real-time
    - Evolve the user interface based on user behavior
    - Customize automation rules intelligently
    - Improve the system continuously
    
    Current step: Welcome user and explain the intelligent setup process.
    
    Respond with JSON: {
      "message": "Welcome message to user",
      "nextStep": "next_step_name",
      "uiChanges": ["list of UI improvements to make"],
      "instructions": "What the user should do next"
    }`;

    try {
      const result = await this.geminiClient.generateContent(setupPrompt);
      const response = this.safeParseJSON(result.response.text());
      
      this.currentSetupStep = response.nextStep;
      await this.logEvolution('setup_started', response);
      
      return response;
    } catch (error) {
      console.error('Setup initialization failed:', error);
      return null;
    }
  }

  async processUserAction(action, data) {
    if (!this.geminiClient || !this.setupMode) return null;

    const contextPrompt = `You are managing an intelligent WiFi triangulation setup. 
    
    Current context:
    - Setup step: ${this.currentSetupStep}
    - User action: ${action}
    - Action data: ${JSON.stringify(data)}
    - User context: ${JSON.stringify(this.userContext)}
    - Device queue: ${JSON.stringify(this.deviceSetupQueue)}
    
    Based on this action, determine:
    1. What the user is trying to accomplish
    2. How to guide them next
    3. What UI improvements to make
    4. What device/location data to record
    5. How to evolve the system
    
    Respond with JSON: {
      "message": "Response to user",
      "nextStep": "next_step_name", 
      "uiChanges": ["UI modifications to make"],
      "dataToRecord": {"key": "value pairs to save"},
      "systemEvolution": "How to improve the system",
      "instructions": "Next user instructions"
    }`;

    try {
      const result = await this.geminiClient.generateContent(contextPrompt);
      const response = this.safeParseJSON(result.response.text());
      
      // Update context
      this.currentSetupStep = response.nextStep;
      if (response.dataToRecord) {
        Object.assign(this.userContext, response.dataToRecord);
      }
      
      // Log evolution
      await this.logEvolution(action, response);
      
      return response;
    } catch (error) {
      console.error('Action processing failed:', error);
      return null;
    }
  }

  async evolveUserInterface(currentUI, userBehavior) {
    if (!this.geminiClient) return null;

    const evolutionPrompt = `You are evolving a smart home interface based on user behavior.
    
    Current UI state: ${JSON.stringify(currentUI)}
    User behavior patterns: ${JSON.stringify(userBehavior)}
    Evolution history: ${JSON.stringify(this.evolutionHistory.slice(-5))}
    
    Analyze the user's patterns and suggest UI improvements:
    1. Layout optimizations
    2. New features to add
    3. Workflow improvements
    4. Personalization changes
    5. Automation suggestions
    
    Respond with JSON: {
      "uiChanges": {
        "layout": "new layout suggestions",
        "features": ["new features to add"],
        "styling": "CSS changes to make",
        "workflow": "workflow improvements"
      },
      "reasoning": "Why these changes will help the user",
      "priority": "high/medium/low"
    }`;

    try {
      const result = await this.geminiClient.generateContent(evolutionPrompt);
      const response = this.safeParseJSON(result.response.text());
      
      await this.logEvolution('ui_evolution', response);
      return response;
    } catch (error) {
      console.error('UI evolution failed:', error);
      return null;
    }
  }

  async generateAutomationRules(deviceData, locationData, userPreferences) {
    if (!this.geminiClient) return [];

    const automationPrompt = `Create intelligent automation rules based on user data.
    
    Device data: ${JSON.stringify(deviceData)}
    Location data: ${JSON.stringify(locationData)}
    User preferences: ${JSON.stringify(userPreferences)}
    
    Generate smart automation rules that:
    1. Learn from user behavior
    2. Anticipate user needs
    3. Optimize energy usage
    4. Enhance security
    5. Improve comfort
    
    Respond with JSON array: [{
      "name": "rule name",
      "trigger": "what triggers this rule",
      "action": "what action to take",
      "reasoning": "why this rule helps the user",
      "adaptable": true/false
    }]`;

    try {
      const result = await this.geminiClient.generateContent(automationPrompt);
      const rules = this.safeParseJSON(result.response.text());
      
      await this.logEvolution('automation_generation', { rules });
      return rules;
    } catch (error) {
      console.error('Automation generation failed:', error);
      return [];
    }
  }

  async processWalkingSetup(position, deviceType, setupCodes) {
    const walkingPrompt = `User is walking around setting up devices.
    
    Current position: ${JSON.stringify(position)}
    Device type: ${deviceType}
    Setup codes: ${JSON.stringify(setupCodes)}
    
    Process this walking setup:
    1. Map the device location
    2. Configure the device automatically
    3. Update the floor plan
    4. Suggest next steps
    
    Respond with JSON: {
      "deviceMapped": true/false,
      "deviceConfigured": true/false,
      "floorplanUpdate": "what to update on floor plan",
      "nextInstructions": "what user should do next",
      "automationSuggestions": ["suggested automations for this device"]
    }`;

    try {
      const result = await this.geminiClient.generateContent(walkingPrompt);
      const response = this.safeParseJSON(result.response.text());
      
      // Add to device queue
      this.deviceSetupQueue.push({
        position,
        deviceType,
        setupCodes,
        timestamp: Date.now(),
        configured: response.deviceConfigured
      });
      
      await this.logEvolution('walking_setup', response);
      return response;
    } catch (error) {
      console.error('Walking setup failed:', error);
      return null;
    }
  }

  async continuousImprovement() {
    if (!this.geminiClient) return;

    // Run every hour to analyze and improve the system
    setInterval(async () => {
      const improvementPrompt = `Analyze the system and suggest improvements.
      
      Evolution history: ${JSON.stringify(this.evolutionHistory.slice(-10))}
      User context: ${JSON.stringify(this.userContext)}
      
      What improvements can be made to:
      1. User experience
      2. System performance
      3. Automation intelligence
      4. Interface design
      5. Feature additions
      
      Respond with JSON: {
        "improvements": ["list of improvements"],
        "priority": "high/medium/low",
        "implementation": "how to implement these improvements"
      }`;

      try {
        const result = await this.geminiClient.generateContent(improvementPrompt);
        const improvements = this.safeParseJSON(result.response.text());
        
        await this.logEvolution('continuous_improvement', improvements);
        
        // Broadcast improvements to the UI
        if (global.mainWindow) {
          global.mainWindow.webContents.send('gemini-improvements', improvements);
        }
      } catch (error) {
        console.error('Continuous improvement failed:', error);
      }
    }, 3600000); // Every hour
  }

  async logEvolution(action, data) {
    const evolutionEntry = {
      timestamp: Date.now(),
      action,
      data,
      context: { ...this.userContext }
    };
    
    this.evolutionHistory.push(evolutionEntry);
    
    // Keep only last 100 entries
    if (this.evolutionHistory.length > 100) {
      this.evolutionHistory = this.evolutionHistory.slice(-100);
    }
    
    // Save to file
    try {
      const evolutionPath = path.join(__dirname, '../config/evolution-history.json');
      await fs.writeFile(evolutionPath, JSON.stringify(this.evolutionHistory, null, 2));
    } catch (error) {
      console.error('Failed to save evolution history:', error);
    }
  }

  async loadEvolutionHistory() {
    try {
      const evolutionPath = path.join(__dirname, '../config/evolution-history.json');
      const data = await fs.readFile(evolutionPath, 'utf8');
      this.evolutionHistory = JSON.parse(data);
    } catch {
      this.evolutionHistory = [];
    }
  }

  getSetupProgress() {
    return {
      currentStep: this.currentSetupStep,
      devicesConfigured: this.deviceSetupQueue.filter(d => d.configured).length,
      totalDevices: this.deviceSetupQueue.length,
      userContext: this.userContext
    };
  }
}

module.exports = { GeminiEvolutionEngine };
