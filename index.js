var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var session = require('express-session');
var flash = require('connect-flash');
var async = require('async');
var yelp = require("yelp").createClient({
  consumer_key: process.env.YELP_CONSUMER_KEY,
  consumer_secret: process.env.YELP_CONSUMER_SECRET,
  token: process.env.YELP_TOKEN,
  token_secret: process.env.YELP_TOKEN_SECRET
});
var ejsLayouts = require('express-ejs-layouts');
var app = express();
var db = require('./models');
var sequelize = require('sequelize')


app.use(ejsLayouts);
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(session({
 secret:"o12i3qwreaq3roj4t5haw4",
 resave: false,
 saveUninitialized: true
}));
app.use(flash());

// USERS LOGGING IN
app.use(function(req,res,next){
	// req.session.user = 1
	if(req.session.user){
		db.user.findById(req.session.user).then(function(user){
			req.currentUser = user;
			next();
		});
	}else {
		req.currentUser = false;
		next();
	}
});

app.use(function(req,res,next){
	res.locals.currentUser = req.currentUser;
	if(req.currentUser){
		var cleanUser = req.currentUser.get();
		delete cleanUser.password;
	}else{
		var cleanUser = false;
	}
	res.locals.cleanUser = cleanUser;
	res.locals.alerts = req.flash();
	next();
});


app.get('/', function(req,res){
	res.render('indexs');
});

app.get('/login', function(req, res){
	res.render('main/login');
});

app.post('/login', function(req,res){
	db.user.authenticate(req.body.email, req.body.password, function(err,user){
		if(err){
			res.send(err)
		}else if(user){
			req.session.user = user.id;
			req.flash('success', 'You are logged in.')
			res.redirect('/')
		}else{
			req.flash('danger', 'invalid username or password');
			res.redirect('/login')
		}
	})
})

app.get('/logout',function(req,res){
  req.flash('info','You have been logged out.');
  req.session.user = false;
  res.redirect('/');
});

app.get('/register', function(req, res){
	res.render('main/register');
});

// USERS SIGNING UP

app.post("/register", function(req,res){
	if(req.body.password != req.body.password2){
		req.flash('danger', 'Passwords must match');
		res.redirect('/register');
	}else{
		db.user.findOrCreate({
			where: {
				email: req.body.email
			},
			defaults: {
				email: req.body.email,
				password: req.body.password,
				username: req.body.username
			}
		}).spread(function(user,created){
			if(created){
				req.session.user = user.id;
				req.flash('success', 'You are signed up!');
				res.redirect('/');
			}
		}).catch(function(err){
			if(err.message){
				req.flash('danger',err.message);
				console.log(err);
			}
			res.redirect('/register');
		})
	}
})

// Search By City or Zipcode
app.get('/results', function(req,res){
	yelp.search({term: "food", location: req.query.searchTerm}, function(err, data){

		var yelpItems = [];
		var placeHolders = [];
		var IDs = [];
		var yelpMap = {};

		data.businesses.forEach(function(item){
			placeHolders.push('?');
			IDs.push(item.id);
			yelpMap[item.id] = yelpItems.length;
			yelpItems.push({
				id: item.id,
        name: item.name,
        love: 0,
        hate: 0,
        score: 0
			});
		});

		var inList = placeHolders.join(',')
		var query = 'SELECT yelp_id, lcount, hcount, lcount+hcount AS "score" from (SELECT "yelp_id", sum("love") AS "lcount", sum("hate") AS "hcount" FROM "comments" AS "comment" WHERE "comment"."yelp_id" IN ('+inList+') GROUP BY "yelp_id") c ORDER BY score DESC;'

		db.sequelize.query(query,
		  { replacements: IDs, type: sequelize.QueryTypes.SELECT }
		).then(function(comments) {
			var results = [];
			comments.forEach(function(comment){
				var idx = yelpMap[comment.yelp_id];
				var result = yelpItems[idx];
				yelpItems[idx] = false;
				result.love = parseInt(comment.lcount);
				result.hate = parseInt(comment.hcount);
				result.score = parseInt(comment.score);
				results.push(result);
			});
			results = results.concat(yelpItems.filter(function(item){ return !!item; }));
		  res.render('main/results', {results:results})
		});
	});
});

// Search by Business Name
app.get('/resultsName', function(req,res){
	console.log(req.query.searchName)

	yelp.search({term:req.query.searchName, location: req.query.searchLocation}, function(error, data) {
	  console.log(error);
	  console.log(data);
	  db.comment.findAll({
	  	where:{
	  		yelp_id: data.id,
	  	}
	  }).then(function(comments){
	  	db.comment.sum('love', {where:{yelp_id: data.id}}).then(function(loveSum){
	  		db.comment.sum('hate', {where:{yelp_id: data.id}}).then(function(hateSum){
	  			res.render('main/resultsName', {data:data.businesses, comments:comments, loveSum:loveSum, hateSum:hateSum});
	  		});
	  	});
	  });

	  // res.send(data)


	});
});

app.get('/results/:id', function(req,res){
	yelp.business(req.params.id, function(error, data) {
	  console.log(error);
	  console.log(data);
	  // res.send(data)
	  db.comment.findAll({
	  	where:{
	  		yelp_id: data.id,
	  	},
	  	include:[db.user]
	  }).then(function(comments){

	  	console.log(comments)
	  	var loveSum = 0;

	  	db.comment.sum('love', {where:{ yelp_id: data.id}}).then(function(loveSum){
	  		// console.log(sum);
	  		db.comment.sum('hate', {where:{ yelp_id: data.id}}).then(function(hateSum){
	  			// console.log(sum);
	  			//res.send(comments)
	  			res.render('main/restuarant', {data: data, comments:comments, loveSum:loveSum, hateSum:hateSum});
	  		});
	  	});

	  });

	// res.send("restuarant info works");
	});
});


app.delete("/results/:yelp_id/:id", function(req, res){
	db.comment.findById(parseInt(req.params.id)).then(function(comment){
		comment.destroy().then(function(){
			res.send({msg:"OK"});
		}).catch(function(error){
			res.send({msg:"ERROR"});
		});
	}).catch(function(error){
		res.send({msg: "ERROR"})
	});
});

app.get("/results/:yelp_id/edit/:id", function(req,res){
	db.comment.findById(parseInt(req.params.id)).then(function(comment){
		res.render('main/scoreedit',{comment:comment})
	});
});

app.put("/results/:yelp_id/:id", function(req,res){
	db.comment.findById(parseInt(req.params.id)).then(function(comment){
		comment.body = req.body.comment;
		comment.love = req.body.loves;
		comment.hate = req.body.hates;
		comment.save();

		res.send({msg: "OK"});
	}).catch(function(error){
		res.send({msg: "Error"});
	});
});

app.get('/score/:id', function(req,res){

	res.render('main/score', {id: req.params.id});
});

app.post('/score/:id', function(req,res){
	db.comment.create({
			body: req.body.comment,
			love: req.body.loves,
			hate: req.body.hates,
			yelp_id: req.params.id,
			user_id: req.session.user
}).then(function(comment){
	res.redirect('/results/' + req.params.id)
});
});



app.listen(3000);