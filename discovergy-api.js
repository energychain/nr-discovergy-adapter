module.exports = function(RED) {

    function APIConfiguration(n) {
            RED.nodes.createNode(this,n);
            this.username = n.email;
            this.password = n.password;
    }   
    RED.nodes.registerType("discovergy-api",APIConfiguration);
}