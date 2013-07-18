var http = require('http'),
	fs = require('fs'),
	crypto = require('crypto'),
	cheerio = require('cheerio');

var me = process.argv[1].split('/'),
    root = me.slice(0, me.length - 1).join('/') + "/",
    categories = fs.readFileSync(root + "categories.txt").toString().split("\n"),
    config = JSON.parse(fs.readFileSync(root + "config.json")),
	HOST = config.host,
	DB = config.db,
	AUTH = config.auth,
	PORT = config.port || 80;

var dir = root + "blackmilkclothing.com/products";
var files = fs.readdirSync(dir);

for (var i = 0, l = files.length; i < 30; i++) {
	var f = files[i],
		jsf = f + '.oembed';
	if (fs.existsSync(dir + '/' + jsf)) {
		work(f, jsf);
	}
}

function log(f, msg) {
	console.log('[' + f + '] ' + msg);
}

function work(f, jsf) {
	var json = fs.readFileSync(dir + '/' + jsf);
	var shasum = crypto.createHash('sha1');
	shasum.update(json);
	var thumbprint = shasum.digest('hex');
	json = JSON.parse(json);
	var req = http.request({
			hostname: HOST,
			port: PORT,
			auth: AUTH,
			path: DB + f
		}, function(res) {
			log(f, 'starting');
			var exists = res.statusCode == 200;
			var body = '';
			res.on('data', function(s) {
					body += s;
				});
			res.on('end', function() {
					var prior = '';
					if (exists) {
						prior = body;
						body = JSON.parse(body);
						if (body.thumbprint == thumbprint) {
							log(f, 'no local changes...');
							return; // no local change
						}
						body.brand = json.brand;
					} else {
						body = json;
					}
                    var cats = categories.filter(function(it) {
                            return it.indexOf(f + ":") == 0;
                        }).map(function(it) {
                            return it.split(":")[1];
                        });
                    if (! body.categories) {
                        body.categories = [];
                    }
                    cats.forEach(function(cat) {
                        if (body.categories.indexOf(cat) < 0) {
                            body.categories.push(cat);
                        }
                    });
					body.thumbprint = thumbprint;
					var $ = cheerio.load(fs.readFileSync(dir + '/' + f));
					body.hashtag = $('span.tag').first().text();
					if (json.thumbnail_url) {
						var parts = json.thumbnail_url.split('?');
						parts = parts[0].split('.');
						body.image = {
							root: parts.slice(0, parts.length - 1).join('.'),
							ext: parts[parts.length - 1]
						};
					}
					delete body.thumbnail_url;
					delete body.product_id;
					body = JSON.stringify(body);
					if (body == prior) {
						log(f, 'document is unchanged');
						return; // no local change
					}
					http.request({
							hostname: HOST,
							port: PORT,
							auth: AUTH,
							method: 'PUT',
							path: DB + f
						},
						function(res) {
							res.on('data',
								   function(s) {
									   log(f, 'save: ' + s);
								   });
							res.on('end',
								   function() {}
								   );
						})
						.on('error',
							function() {
								log(f, 'error: ' + JSON.stringify(arguments));
							})
						.end(body);
				});
		});
	req.on('error', function(){
			log(f, 'error: ' + JSON.stringify(arguments));
		});
	req.end();
}
