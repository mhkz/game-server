/*
 * @Author: guofeng 
 * @Date: 2019-01-22 16:37:11 
 * @Last Modified by: guofeng
 * @Last Modified time: 2019-01-23 18:55:34
 */
var net = require("net");

var log = require("./../utils/logs");
var tcppkg = require("./tcppkg");

var netbus = {
    PROTO_JSON: 1,
    PROTO_BUF: 2,
}

var global_session_list = {};
var global_session_key = 1;

/**
 * @description 用户进来
 * @param {*} session 
 * @param {*} proto_type 
 */
function on_session_enter(session, proto_type, is_ws){
    log.info("session enter", session.remoteAddress, session.remotePort);
    session.last_pkg = null; // 表示存储上一次没有处理完的 TCP 包
    session.is_ws = is_ws;

    // 将 session 加入到 session_list 中
    global_session_list[global_session_key] = session;
    session.session_key = global_session_key;
    global_session_key ++;
}

/**
 * @description 接收的是一个整包
 * @param {*} session 
 * @param {*} cmd 
 */
function on_session_recv_cmd (session, cmd) {
    log.info("session_recv_cmd", cmd);
}
/**
 * @description 用户离开
 * @param {*} session 
 */
function on_session_exit(session) {
    log.info("session  exit !!!");
    session.last_pkg = null;
    if (global_session_list[session.session_key]) {
        global_session_list[session.session_key] = null;                                                                                                                                 
        delete global_session_list[session.session_key];
        session.session_key = null;
    }
}

/**
 * @description  add_client_session_event
 * @param {*} session_event 
 * @param {*} proto_type 
 */
function add_client_session_event(session, proto_type, is_ws){

    session.on("close", function() {
        on_session_exit(session);
    });


    session.on("data", function(data) {
        // start
        var last_pkg = session.last_pkg
		if (last_pkg != null) { // 上一次剩余没有处理完的半包;
			var buf = Buffer.concat([last_pkg, data], last_pkg.length + data.length);
			last_pkg = buf;
		}
		else {
			last_pkg = data;	
		}

		var offset = 0;
		var pkg_len = netpkg.read_pkg_size(last_pkg, offset);
		if (pkg_len < 0) {
			return;
		}

		while(offset + pkg_len <= last_pkg.length) { // 判断是否有完整的包;
			// 根据长度信息来读取我们的数据,架设我们穿过来的是文本数据
			var cmd_buf = Buffer.allocUnsafe(pkg_len - 2); // 2个长度信息
			last_pkg.copy(cmd_buf, 0, offset + 2, offset + pkg_len);

            // 收到了一个完整的数据包
            on_session_recv_cmd(session, cmd_buf);

			offset += pkg_len;
			if (offset >= last_pkg.length) { // 正好我们的包处理完了;
				break;
			}

			pkg_len = netpkg.read_pkg_size(last_pkg, offset);
			if (pkg_len < 0) {
				break;
			}
		}

		// 能处理的数据包已经处理完成了,保存 0.几个包的数据
		if (offset >= last_pkg.length) {
			last_pkg = null;
		} else { // offset, length这段数据拷贝到新的Buffer里面
			var buf = Buffer.allocUnsafe(last_pkg.length - offset);
			last_pkg.copy(buf, 0, offset, last_pkg.length);
			last_pkg = buf;
        }
        session.last_pkg = last_pkg;
		// end 
    });
    on_session_enter(session, proto_type, false);

    session.on("error", function(err) {
        console.log("error", err);
    });
}


/**
 * @ip ip
 * @port 端口
 * @proto_type 传输类型
 */
function start_tcp_server (ip, port, proto_type) {
    log.info("start server", ip, port, proto_type)
    var server = net.createServer(function(client_sock) { 
        add_client_session_event(client_sock, proto_type)
    });

    server.on("error", function() {
        log.error("listen server error")
    });
    
    server.on("close", function() {
         log.error("listen server close")
    });

    server.listen({
        port: port,
        ip: ip,
        exclusive: true
    })
}
netbus.start_tcp_server = start_tcp_server;
module.exports = netbus;