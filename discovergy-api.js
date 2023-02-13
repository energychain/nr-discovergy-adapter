module.exports = function(RED) {
    const fs = require("fs");

    function APIConfiguration(n) {
            this.baseDir = '.';
            if(typeof RED.settings.userDir !== 'undefined') {
                this.baseDir = RED.settings.userDir;
            }
            const node = this;
            if(!fs.existsSync(this.baseDir + "/EnergyProfiles")) {
                fs.mkdirSync(this.baseDir + "/EnergyProfiles");
            }
            this.baseDir = this.baseDir + "/EnergyProfiles";
            RED.nodes.createNode(this,n);
    }   
    RED.nodes.registerType("discovergy-config",APIConfiguration);
}