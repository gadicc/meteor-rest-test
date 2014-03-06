var incoming = new Meteor.Collection('incoming');

if (Meteor.isClient) {
	Template.testOptions.events({
		'click button': function(event, tpl) {
			event.preventDefault();

			var data = $('#data').val().trim();
			try {
				data = data == '' ? null : JSON.parse(data);
			} catch (err) {
				alert('Invalid JSON in data:\n' + err.toString());
				return;
			}

			var query = $('#query').val().trim();
			try {
				query = query == '' ? null : JSON.parse(query);
			} catch (err) {
				alert('Invalid JSON in query:\n' + err.toString());
				return;
			}

			HTTP.call($('#method').val(), $('#url').val(), {
				content: $('#content').val(),
				data: data,
				query: query,
				params: $('#params').val(),
				auth: $('#auth').val(),
				headers: $('#headers').val()
			}, function(error, result) {
				if (error) {
					$('#error').text(JSON.stringify(error, null, 2));
					console.log(error);
				} else
						console.log(result);
					$('#response').text(result ? JSON.stringify(result, null, 2) : '');
					$('#responseContent').text(result ? result.content : '');
			});
		}

	});

	Template.testResult.helpers({
		data: function() {
			return incoming.findOne();
		},
		obj: function(obj) {
			return '<pre>' + JSON.stringify(obj, null, 2) + '</pre>';
		}
	});
}

if (Meteor.isServer) {
	Meteor.startup(function() {
		if (incoming.find().count() == 0)
			incoming.insert({ req: {} });
	});

	Meteor.onConnection(function() {
			incoming.update({}, { req: {} });
	});

	var connect = Meteor.require('connect');
	var Fiber = Meteor.require('fibers');
	WebApp.connectHandlers
	    .use(connect.urlencoded())  // these two replace
	    .use(connect.json())        // the old bodyParser
	    .use('/restTest', function(req, res, next) {
	    		res.writeHead(200, {'Content-Type': 'text/html'});
          res.end('<html><body>OK</body></html>');
	 
	        Fiber(function() {

							incoming.update({}, { $set: {
								time: new Date(),
								req: {
									httpVersion: req.httpVersion,
									headers: req.headers,
									url: req.url,
									method: req.method,
									statusCode: req.statusCode,
									query: req.query,
									body: req.body
								}
							} });
	 
	        }).run();
	    });

}
