var chai = require('chai');
var expect = chai.expect;
var Promise = require('bluebird');

describe('#withMessage()', function() {
	describe('on async validators', function() {

		before(function() {
			delete require.cache[require.resolve('../lib/express_validator')];
		});

		it('should not affect a passing validation', function(done) {
			var validator = require('../lib/express_validator')({
				customValidators: {
					test: function() {
						// A dummy passing validator
						return new Promise(function(resolve) {
							resolve();
						});
					}
				}
			});

			var req = {
				body: {
					testParam: 100
				}
			};

			validator(req, {}, function() {});
			req.check('testParam', 'Default Message')
				.test().withMessage('Custom Message');

			verify(done, function() {
				return req.asyncValidationErrors()
					.catch(function() {
						expect.fail(null, null, 'No errors should have been generated by the test');
					});
			});

		});

		it('should provide a custom message when a validation fails', function(done) {
			var validator = require('../lib/express_validator')({
				customValidators: {
					test: function() {
						// A dummy failing validator
						return new Promise(function(resolve, reject) {
							reject();
						});
					}
				}
			});

			var req = {
				body: {
					testParam: 100
				}
			};

			validator(req, {}, function() {});

			req.check('testParam', 'Default Message')
				.test().withMessage('Custom Message');

			verify(done, function() {
				return req.asyncValidationErrors()
					.catch(function(err) {
						expect(err).to.deep.equal([{
							msg: 'Custom Message',
							param: 'testParam',
							value: 100
						}]);
					});
			});
		});

		it('should provide the default message if it was not the validation to fail', function(done) {
			var validator = require('../lib/express_validator')({
				customValidators: {
					pass: function() {
						return new Promise(function(resolve) { resolve(); });
					},
					fail: function() {
						return new Promise(function(resolve, reject) { reject(); });
					}
				}
			});

			var req = {
				body: {
					testParam: 100
				}
			};

			validator(req, {}, function() {});

			req.check('testParam', 'Default Message')
				.fail() // Default Message
				.pass().withMessage('Passing Message')
				.fail() // Default Message
				.fail().withMessage('Failing Message')
				.fail() // Default Message
				.fail().withMessage('Failing Message 1')
				.fail().withMessage('Failing Message 2');

			var expected = [
				'Default Message',
				'Default Message',
				'Failing Message',
				'Default Message',
				'Failing Message 1',
				'Failing Message 2'];

			verify(done, function() {
				return req.asyncValidationErrors()
					.catch(function(err) {
						expect(err.map(function(e) {return e.msg;})).to.deep.equal(expected);
					});
			});
		});

		// Helper to handle resolving tests async
		function verify(done, f) {
			try {
				var test = f();
				if (test && test.then) {
					test.then(function() {
						done();
					})
					.catch(function(err) {
						done(err);
					});
				} else {
					done();
				}
			}
			catch (e) {
				done(e);
			}
		}
	});
});