var express = require("express");
var upload = require('jquery-file-upload-middleware');
var session = require('express-session');
var mime = require('mime');
var app = express();
var bodyParser = require('body-parser');
var gm = require('gm').subClass({imageMagick: true});
var outdir = __dirname + '/out/';
var url = 'http://www.imagemagick.org/Usage/files/';

var config = {
	
	allowOrigin: 'http://localhost:8888',
	port : 80,
	secret:'monies',
	maxAge:1440000
	
}

    // configure upload middleware
   upload.configure({
            
			accessControl: {
            allowOrigin: config.allowOrigin,
            allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE'
        }
        });

		
var Server = function(options){
    options = options || {};
    this.port = options.port ||  config.port || 9999; 

};

Server.prototype.start = function(cb){
    var self = this ;
    var port = self.port;
    app.listen(port, function (err) {
        if (err){

            return cb(err);
        }
        console.log('Server listening on port '+port+' !');
        return cb ? cb():'' ;
    });

};

module.exports = Server;


	app.use(session({
    secret: config.secret,
    cookie: {
        maxAge: config.maxAge //config.maxAge 
    }
	}));

	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Credentials', true);
		res.header('Access-Control-Allow-Origin',config.allowOrigin);
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
		next();
	});
	
	/*
	app.delete('/upload/:filename',function(req,res,next){
	
		var filename = req.params.filename;
		var sessionID = req.sessionID;
		var fullpath = __dirname + '/public/uploads/' + sessionID + '/' + filename;
		var fullthumbpath = __dirname + '/public/uploads/' + sessionID + '/thumbnail/' + filename;
		require('fs').unlink(fullpath,function(err){
		
			if (err){
				console.log(err);
				res.status(500).json({err:err});
			}else{
				require('fs').unlink(fullthumbpath,function(err){
				
					if (err){
						console.log(err);
						res.status(500).json({err:err});
					}else{
						res.status(200).json({success:'true'});
					}
				});
			}
		});
		
		
	});
	*/
	
    app.post('/upload', function (req, res, next) {
            // imageVersions are taken from upload.configure()
			
            upload.fileHandler({
                uploadDir: function () {
                    return __dirname + '/public/uploads/' + req.sessionID;
                },
                uploadUrl: function () {
                    return '/uploads/' + req.sessionID;
                }
            })(req, res, next);
				
    });
	
	
	
	
	// tracking pixel response to know when page has been reloaded on remote server
	app.get('/ping',function(req,res,next){
		
		
		req.session.destroy(function(err) {
			// cannot access session here
			res.send(200);
			
		});
	});
	
	/// Redirect all to home except post
	app.get('/upload', function( req, res ){
		res.redirect('/');
	});

	app.put('/upload', function( req, res ){
		res.redirect('/');
	});

	app.delete('/upload', function( req, res ){
		res.redirect('/');
	});
	
	
    app.get('/convert', function(req,res,next){

            convert(function(err,outname){
				
				if (err){
					res.status(500).json({err:err});
				}
				else{
					require('fs').stat(outdir + outname,function(err,stats){
							if (err){
								console.log(err)
								res.status(500).json({err:err});
							}else{
								var outPdfStream =  require('fs').createReadStream(outdir + outname);
								res.setHeader('X-File-Name', outname);
								res.setHeader('X-File-Size', stats.size);
								res.setHeader('Content-Length', stats.size);
								res.setHeader('Content-disposition', 'attachment; filename=' + outname);
								res.setHeader('Content-type', mime.lookup(outname));
								//NOTES, sent header first.
								//some src stream will overrider the content-type, content-length when pipe
								res.writeHead(200);
								outPdfStream.pipe(res)
								/*
								.on('finish',function(){
									req.session.destroy(function(err) {
										//res.status(500).json({err:err});
									});
								});*/
							}
					});							
				}
				
			});

    });
	
	

        // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }));

		// parse application/json
    app.use(bodyParser.json());


var convert = function(cb){
	var outname = require('crypto').randomBytes(4).toString('hex')+'-converted.pdf';	
	gm(url)
		.resize(1190,1684,'>')
		.gravity('Center')
		.page('1190','1684')
		.write(outdir + outname, function(err){
			if (err) {
				return cb(err);
			}else{
				cb(null,outname);
			}
	});
	
};  
