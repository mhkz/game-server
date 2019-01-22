### 启动
mac ./start_webserver.sh 

### 依赖模块
- express
- redis
- mysql
- ws

### 功能说明
- 3rd 第三方 sdk
- database 数据库


webserver: 提供 web服务 文件的上传下载，更新等功能

gateway 网关服务器
    - 接收客户端连接，转发客户端请求
    - 连接游戏服务器 转发服务器回应
    - 安全防护，隔离非法的数据包和请求，免受客户攻击

用户中心服务器： 统一管理账户，统一账户可以玩平台的不同游戏
游戏服务器： 处理不同的游戏服务
