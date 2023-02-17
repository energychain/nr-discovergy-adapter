module.exports = function(RED) {

    function APIConfiguration(n) {
            RED.nodes.createNode(this,n);
            this.config = n;
    }   
    RED.nodes.registerType("discovergy-api",APIConfiguration);
}