class ScannerStrategy {
  async scan() {
    throw new Error('Method scan() must be implemented');
  }

  parseOutput(output) {
    throw new Error('Method parseOutput() must be implemented');
  }
}

module.exports = ScannerStrategy;
