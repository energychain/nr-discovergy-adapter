module.exports = function(RED) {
    function Reader(config) {
        const axios = require("axios");

        RED.nodes.createNode(this,config);
        const node = this;
        node.api = RED.nodes.getNode(config.api);
        node.meters = null;
        node.on('input', async function(msg) {
           // Get list of all meterIDs
           if(node.meters == null) {
            try {
                const rq = await axios.get("https://api.discovergy.com/public/v1/meters",{
                    auth: {
                        username: node.api.username,
                        password: node.api.password
                    }
                });
                if((typeof config.meters !== 'undefined') && (config.meters !== null) && (config.meters.length >0)) {
                        let list = config.meters.split(',');
                        node.meters = [];
                        for(let j=0;j<rq.data.length;j++) {
                            for(let i=0;i<list.length;i++) {
                                if(rq.data[j].serialNumber == list[i]) node.meters.push(rq.data[j]); else
                                if(rq.data[j].administrationNumber == list[i]) node.meters.push(rq.data[j]); else
                                if(rq.data[j].meterId == list[i]) node.meters.push(rq.data[j]); else 
                                if(rq.data[j].fullSerialNumber == list[i]) node.meters.push(rq.data[j]);
                            }
                        }     
                } else {
                    node.meters = rq.data;
                }
            } catch(e) {
                node.status({ fill: "red", shape: "dot", text: "Failed to retrieve MeterIDs "+e});
                node.error(e);
            }
           }
           let SLEEP_TIME = 0;
           if(!isNaN(config.delay)) SLEEP_TIME = config.delay;

           if(Array.isArray(node.meters)) {
                msg.payload = [];
                for(let i=0;i<node.meters.length;i++) {
                    node.status({ fill: "yellow", shape: "dot", text: "Fetching "+node.meters[i].printedFullSerialNumber});
                    try {
                        if(typeof node.meters[i].field_names == 'undefined') {
                            if((typeof config.field_names !== 'undefined') && (config.field_names.length >0)) {
                                node.meters[i].field_names = config.field_names;
                            } else { 
                                const rq = await axios.get("https://api.discovergy.com/public/v1/field_names?meterId="+node.meters[i].meterId,{
                                    auth: {
                                        username: node.api.config.username,
                                        password: node.api.config.password
                                    }
                                });
                                await new Promise(r => setTimeout(r, SLEEP_TIME));
                                let field_names = "";
                                
                                node.meters[i].field_names = rq.data.join(',');
                            }
                        }
                        const rq = await axios.get("https://api.discovergy.com/public/v1/last_reading?meterId="+node.meters[i].meterId+"&fields="+node.meters[i].field_names,{
                                    auth: {
                                        username: node.api.config.username,
                                        password: node.api.config.password
                                    }
                        });
                        await new Promise(r => setTimeout(r, SLEEP_TIME));
                        let influxpayload = rq.data.values;
                        influxpayload.reading_time = rq.data.time;

                        rq.data.meter = node.meters[i];
                        const meter = node.meters[i];
                        meter.last_reading = influxpayload;
                         node.send([{payload:rq.data},{
                            measurement:node.meters[i].serialNumber,
                            payload:[influxpayload]
                         },{payload:meter,query:{"serialNumber":meter.serialNumber}},null]);
                    } catch(e) {
                        node.status({ fill: "red", shape: "dot", text: "Error getting Reading "+e});
                        node.error("Error getting Reading");
                        node.error("Affected MeterID:" + node.meters[i].meterId);
                        node.error(e);
                    }
                }
            
                node.send([null,null,null,{payload:new Date().getTime()}]);
                node.status({ fill: "green", shape: "dot", text: ""});
           } else {
                node.status({ fill: "red", shape: "dot", text: "Invalid Meter List"});
           }
        });
    }
    RED.nodes.registerType("Last Reading",Reader);
}
