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

for (var i = 0, l = files.length; i < l; i++) {
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
	var chksum = crypto.createHash('sha1');
	chksum.update(json);
	var thumbprint = chksum.digest('hex');
	json = JSON.parse(json);
	var req = http.request({
			hostname: HOST,
			port: PORT,
			auth: AUTH,
			path: DB + f
		}, function(res) {
			var exists = res.statusCode == 200;
			var docBody = '';
			res.on('data', function(s) {
                docBody += s;
				});
			res.on('end', function() {
                var prior = '',
                    doc;
                if (exists) {
                    prior = docBody;
                    doc = JSON.parse(docBody);
//                    if (doc.thumbprint == thumbprint) {
//                        log(f, 'no local changes...');
//                        return; // no local change
//                    }
                    doc.brand = json.brand;
                } else {
                    doc = json;
                    doc.createdAt = new Date().valueOf();
                }
                if (doc.createdAt == null) {
                    doc.createdAt = Date.parse("2013-07-18T11:42:00-0700");
                }
                doc.updatedAt = new Date().valueOf();

                // cats from the list
                var cats = categories.filter(function(it) {
                        return it.indexOf(f + ":") == 0;
                    }).map(function(it) {
                        return it.split(":")[1];
                    });

                // cat from the brand
                var bc = doc.brand;
                if (bc.indexOf("Black Milk ") == 0) {
                    bc = bc.substr(11);
                }
                if (bc.indexOf("Limited ") == 0) {
                    cats.push("Limited");
                    bc = bc.substr(8);
                }
                cats.push(bc);

                // cats from the title
                if (doc.title.indexOf("LIMITED") >= 0) {
                    cats.push("limited");
                }

                if (! doc.categories) {
                    doc.categories = [];
                }
                cats.map(function(cat) {
                    return cat.toLowerCase()
                        .replace(/([0-9])-([0-9])/g, "$1_$2")
                        .replace(/-/g, " ")
                        .replace(/_/g, "-");
                }).forEach(function(cat) {
                    if (cat != "black milk" && doc.categories.indexOf(cat) < 0) {
                        doc.categories.push(cat);
                    }
                });
                doc.thumbprint = thumbprint;
                var $ = cheerio.load(fs.readFileSync(dir + '/' + f));
                doc.hashtag = $('span.tag').first().text();
                if (json.thumbnail_url) {
                    var parts = json.thumbnail_url.split('?');
                    parts = parts[0].split('.');
                    doc.image = {
                        root: parts.slice(0, parts.length - 1).join('.'),
                        ext: parts[parts.length - 1]
                    };
                }
                delete doc.thumbnail_url;
                delete doc.product_id;
                doc = JSON.stringify(doc);
                if (doc == prior) {
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
                    .end(doc);
				});
		});
	req.on('error', function(){
			log(f, 'error: ' + JSON.stringify(arguments));
		});
	req.end();
}
