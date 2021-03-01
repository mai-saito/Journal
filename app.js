require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const multer = require('multer');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const findOrCreate = require('mongoose-findorcreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const app = express();
const Schema = mongoose.Schema;
const upload = multer({ dest: 'public/uploads/' });

app.use(express.static('public'));
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/journalDB', {
	useNewUrlParser: true,
	useUnifiedTopology: true
});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const postSchema = Schema({
	title: String,
	content: String,
	author: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	image: String,
	created: String,
	published: Boolean
});

const userSchema = Schema({
	username: String,
	password: String,
	displayName: String,
	avatar: String,
	provider: String,
	posts: [{
		type: Schema.Types.ObjectId,
		ref: 'Post'
	}],
	drafts: [{
		type: Schema.Types.ObjectId,
		ref: 'Post'
	}]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const Post = mongoose.model('Post', postSchema);
const User = mongoose.model('User', userSchema);

// const storage = multer.diskStorage({
// 	destination: function(req, file, cb) {
// 		cb(null, '/uploads')
// 	}, 
// 	filename: function(req, file, cb) {
// 		cb(null, file.fieldname + '-' + Date.now());
// 	}
// });
// const upload = multer({storage: storage});

passport.use(new GoogleStrategy({
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: 'http://localhost:3000/auth/google/journal',
	userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
	function (accessToken, refreshToken, profile, cb) {
		User.findOrCreate({
			username: profile.emails[0].value
		}, {
			displayName: profile.displayName,
			provider: 'google'
		}, function (error, user) {
			return cb(error, user);
		});
	}
));

passport.use(new FacebookStrategy({
	clientID: process.env.FACEBOOK_APP_ID,
	clientSecret: process.env.FACEBOOK_APP_SECRET,
	callbackURL: 'http://localhost:3000/auth/facebook/journal',
	profileFields: ['id', 'displayName', 'email']
},
	function (accessToken, refreshToken, profile, cb) {
		User.findOrCreate({
			username: profile.emails[0].value
		}, {
			displayName: profile.displayName,
			provider: 'facebook'
		}, function (error, user) {
			return cb(error, user);
		});
	}
));

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (error, user) {
		done(error, user);
	});
});

app.get('/', function (req, res) {
	Post.find()
		.populate('author')
		.exec(function (error, posts) {
			if (error) {
				console.log(error);
			} else {
				res.render('home', { posts: posts });
			}
		});
});

app.get('/about', function (req, res) {
	res.render('about');
});

app.get('/contact', function (req, res) {
	res.render('contact');
});

app.get('/login', function (req, res) {
	res.render('login');
});

app.get('/register', function (req, res) {
	res.render('register');
});

app.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

app.get('/auth/google',
	passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/journal',
	passport.authenticate('google', { failureRedirect: '/register' }),
	function (req, res) {
		res.redirect('/dashboard');
	}
);

app.get('/auth/facebook',
	passport.authenticate('facebook', { scope: ['email'] })
);

app.get('/auth/facebook/journal',
	passport.authenticate('facebook', { failureRedirect: '/register' }),
	function (req, res) {
		res.redirect('/dashboard');
	}
);

app.get('/compose', function (req, res) {
	if (req.isAuthenticated()) {
		res.render('compose');
	} else {
		res.redirect('/login');
	}
});

app.get('/edit/posts/:title', function (req, res) {
	if (req.isAuthenticated()) {
		Post.findOne({ title: req.params.title })
			.populate('author')
			.exec(function (error, post) {
				if (error) {
					console.log(error);
				} else {
					if (post) {
						res.render('edit-posts', { post: post });
					} else {
						res.redirect('/dashboard');
					}
				}
			});
	}
});

app.get('/edit/drafts/:title', function (req, res) {
	if (req.isAuthenticated()) {
		Post.findOne({ title: req.params.title })
			.populate('author')
			.exec(function (error, post) {
				if (error) {
					console.log(error);
				} else {
					if (post) {
						res.render('edit-drafts', { post: post });
					} else {
						res.redirect('/dashboard');
					}
				}
			});
	}
});

app.get('/posts/:title', function (req, res) {
	Post.findOne({ title: req.params.title })
		.populate('author')
		.exec(function (error, post) {
			if (error) {
				console.log(error);
			} else {
				if (post) {
					res.render('post', { post: post });
				} else {
					res.redirect('/');
				}
			}
		});
});

app.get('/authors/:author', function (req, res) {
	User.findOne({ displayName: req.params.author })
		.populate('posts')
		.exec(function (error, author) {
			if (error) {
				console.log(error);
			} else {
				if (author) {
					res.render('author', { author: author });
				} else {
					res.redirect('/');
				}
			}
		});
});

app.get('/dashboard', function (req, res) {
	if (req.isAuthenticated()) {
		User.findOne({ _id: req.user.id })
			.populate('posts')
			.populate('drafts')
			.exec(function (error, user) {
				res.render('dashboard', { user: user });
			});
	}
});

app.get('/settings', function (req, res) {
	User.findOne({ _id: req.user.id }, function (error, user) {
		if (error) {
			console.log(error);
		} else {
			if (user) {
				res.render('settings', { user: user });
			} else {
				res.redirect('/login');
			}
		}
	});
});

app.get('/thank-you', function (req, res) {
	res.render('thank-you');
})

app.post('/login', function (req, res) {
	const user = new User({
		username: req.body.username,
		password: req.body.password
	});

	req.login(user, function (error) {
		if (error) {
			console.log(error);
		} else {
			if (user) {
				passport.authenticate('local')(req, res, function () {
					res.redirect('/dashboard');
				});
			} else {
				console.log('No match');
				res.redirect('/login');
			}
		}
	});
});

app.post('/register', function (req, res) {
	User.register({ username: req.body.username, displayName: req.body.name, avatar: 'user.png' }, req.body.password, function (error, user) {
		if (error) {
			console.log(error);
		} else {
			if (user) {
				passport.authenticate('local')(req, res, function () {
					res.redirect('/dashboard');
				});
			} else {
				res.redirect('/register');
			}
		}
	});
});

app.post('/compose', upload.single('compose'), function (req, res) {
	// when user pressed publish (投稿する) button to publish posts
	if (req.body.publish) {
		const post = new Post({
			title: req.body.title,
			content: req.body.content,
			author: req.user,
			image: req.file ? req.file.filename : 'default-image.png',
			created: new Date().toLocaleDateString('ko-KR'),
			published: true
		});
		post.save().then(function (post) {
			User.findOneAndUpdate({ _id: post.author }, { $push: { posts: post } }, function (error) {
				if (error) {
					console.log(error);
				} else {
					res.redirect('/dashboard');
				}
			})
		}).catch(function (error) {
			console.log(error);
		});
		// when user pressed save (保存する) button to save drafts
	} else if (req.body.save) {
		const draft = new Post({
			title: req.body.title,
			content: req.body.content,
			author: req.user,
			image: req.file ? req.file.filename : 'default-image.png',
			created: new Date().toLocaleDateString('ko-KR'),
			published: false
		});
		draft.save().then(function (draft) {
			User.findOneAndUpdate({ _id: draft.author }, { $push: { drafts: draft } }, function (error) {
				if (error) {
					console.log(error);
				} else {
					res.redirect('/dashboard');
				}
			});
		}).catch(function (error) {
			console.log(error);
		});
	}
});

app.post('/edit/posts/:title', upload.single('edit-posts'), function (req, res) {
	Post.findOneAndUpdate({ title: req.params.title }, {
		title: req.body.title,
		content: req.body.content,
		image: req.file ? req.file.filename : 'default-image.png',
		created: new Date().toLocaleDateString('ko-KR'),
		published: true
	}, function (error) {
		if (error) {
			console.log(error);
		} else {
			res.redirect('/');
		}
	});
});

app.post('/edit/drafts/:title', upload.single('edit-drafts'), function (req, res) {
	if (req.body.publish) {
		Post.findOneAndUpdate({ title: req.params.title }, {
			title: req.body.title,
			content: req.body.content,
			image: req.file ? req.file.filename : 'default-image.png',
			created: new Date().toLocaleDateString('ko-KR'),
			published: true
		}).then(function (post) {
			User.findOneAndUpdate({ _id: req.user.id }, {
				$pull: { drafts: post.id },
				$push: { posts: post.id }
			})
				.then(function () {
					res.redirect('/dashboard');
				});
		}).catch(function (error) {
			console.log(error);
		});

	} else if (req.body.save) {
		Post.findOneAndUpdate({ title: req.params.title }, {
			title: req.body.title,
			content: req.body.content,
			image: req.file ? req.file.filename : 'default-image.png',
			created: new Date().toLocaleDateString('ko-KR'),
			published: false
		}, function (error, post) {
			if (error) {
				console.log(error);
			} else {
				res.redirect('/dashboard');
			}
		});
	}
});

app.post('/search', function (req, res) {
	Post.find({ title: { $regex: req.body.search, $options: 'i' } }, function (error, posts) {
		if (error) {
			console.log(error);
		} else {
			if (posts) {
				res.render('home', { posts: posts });
			} else {
				res.redirect('home');
			}
		}
	});
});

app.post('/settings', upload.single('image'), function (req, res) {
	User.findOneAndUpdate({ _id: req.user.id }, { avatar: req.file.filename }, function (error, user) {
		if (error) {
			console.log(error);
		} else {
			if (user) {
				res.redirect('/settings');
			}
		}
	});
});

app.patch('/settings', function (req, res) {
	if (req.body.displayName) {
		User.findOneAndUpdate({ _id: req.user.id }, { displayName: req.body.displayName })
			.then(function () {
				res.json({ success: true });
			})
			.catch(function (error) {
				console.log(error);
				res.json({ error: error });
			});
	}

	if (req.body.newPassword) {
		User.findOneAndUpdate({
			$and: [{
				_id: req.user.id,
				password: req.body.currentPassword
			}]
		}, { password: req.body.newPassword }, function (error, user) {
			if (error) {
				console.log(error);
			} else {
				if (user) {
					console.log(user);
				} else {
					console.log('no user matched')
				}
			}
		})
			.then(function () {
				res.json({ success: true });
			})
			.catch(function (error) {
				console.log(error);
				res.json({ error: error });
			});
	}
});

app.delete('/delete/users', function (req, res) {
	User.findOneAndDelete({ _id: req.user.id }, function (error) {
		if (error) {
			console.log(error);
		}
	})
		.then(function () {
			res.json({ success: true });
		})
		.catch(function (error) {
			console.log(error);
			res.json({ error: error });
		});
});

app.delete('/delete/posts/:title', function (req, res) {
	Post.findOneAndDelete({ title: req.params.title })
		.then(function (post) {
			User.findOneAndUpdate({ _id: req.user.id }, { $pull: { posts: post.id } })
				.then(function () {
					res.json({ success: true });
				})
				.catch(function (error) {
					console.log(error);
					res.json({ error: error });
				})
		}).catch(function (error) {
			console.log(error);
		});
});

app.delete('/delete/drafts/:title', function (req, res) {
	Post.findOneAndDelete({ title: req.params.title })
		.then(function (draft) {
			User.findOneAndUpdate({ _id: req.user.id }, { $pull: { drafts: draft.id } })
				.then(function () {
					res.json({ success: true });
				})
				.catch(function (error) {
					console.log(error);
					res.json({ error: error });
				})
		}).catch(function (error) {
			console.log(error);
		});
});

app.listen(3000, function () {
	console.log('Successfully listening to port 3000');
});