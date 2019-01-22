var express = require('express');
var path = require('path');
if(process.argv.length < 3) {
   console.log("输入端口");
   return
}

var app = express();
var port = parseInt(process.argv[2]);
process.chdir("./apps/webserver");

app.use(express.static(path.join(process.cwd(), "www_root")));

app.listen(port);
console.log('webserver start at port ' + port)
