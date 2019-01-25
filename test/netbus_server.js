var netbus = require('../netbus/netbus');

netbus.start_tcp_server("127.0.0.1", 8080, netbus.PROTO_BUF);