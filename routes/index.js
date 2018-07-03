var express = require('express');
var router = express.Router();
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database('url.db');
var url = require("url");
var qr = require('qr-image');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({
		extended: false
	});

/* GET home page. */


router.get('/',function (req, res) {
	res.render('index.ejs');
	//res.render('get.ejs',{"":,"":,});

});




//生成二维码
router.get('/image/:url',function (req, res) {
	//res.render('index.ejs');
	//res.render('get.ejs',{"":,"":,});

  db.all("select * from uta where oriurl=?",req.params.url, function (err, row) {
  if(row==""){
  res.send("没有二维码");
  }else{
  var code = qr.image(row[0]["paurl"], { type: 'png' });
  res.setHeader('Content-type', 'image/png');  //sent qr image to client side
  code.pipe(res);
  };
  });
});


//接收参数
router.post('/', urlencodedParser, function (req, res) {
	//函数区域
	//写入数据库中
	function writeurl() {
		if (req.body.name != "" && req.body.url.includes("http")) {
			db.run("insert into uta values(?,?)", req.body.name, req.body.url, function (err) {if(err!=null){res.send("短网址被占用了：（ 换一个试试：）")}else{res.render('get.ejs',{"answer":"https://xooo.ml/"+req.body.name,"barcode":req.body.name});;}});
				
		} else if (req.body.url.includes("http")) {
			db.all("SELECT count(*) FROM uta", function (err, row) {
				console.log(row[0]["count(*)"]);
				const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
				// var h=row[0]["count(*)"]%52;
				var h = row[0]["count(*)"] % 52;
				var i = Math.floor(row[0]["count(*)"] / 52) % 52;
				var j = Math.floor(row[0]["count(*)"] / 52 / 52) % 52;
				var k = Math.floor(j / 52 / 52 / 52) % 52;
				var l = letters[k] + letters[j] + letters[i] + letters[h];
				db.run("insert into uta values(?,?)", l, req.body.url, function (err) {});
				res.render('get.ejs',{"answer":"https://xooo.ml/"+l,"barcode":l});

			})
		} else {
			console.log("网址不对");
		}
	}
	//函数区域结束
	db.serialize(function () {
		//判断网址是否存在
		db.all("CREATE TABLE IF NOT EXISTS uta (oriurl TEXT unique, paurl TEXT)");
		db.all("select * from uta where paurl=?", req.body.url, function (err, row) {
			if (row == "") {
				writeurl();
			} else {
				console.log(row[0]['paurl'])
				res.render('get.ejs',{"answer":"https://xooo.ml/"+row[0]["oriurl"],"barcode":row[0]["oriurl"]});

			};
		});
	});
});

//直链网址
router.get('/:name', function (req, res) {
	var db = new sqlite3.Database('url.db');
	db.serialize(function () {
		db.all("select * from uta where oriurl=?", req.params.name, function (err, row) {
			if (row == "") {
				console.log("原网址也能Get这个");
			} else {
				res.redirect(row[0].paurl);
			};
		});
	})
});
module.exports = router;
