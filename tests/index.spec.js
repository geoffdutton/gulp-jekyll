
var gutil = require('gulp-util')
jest.mock('win-spawn')
var spawn = require('win-spawn')
var jekyll = require('../')

var fakeStream

beforeEach(() => {
	fakeStream = {
		on: jest.fn((ev, cb) => {
			if (ev === 'close') {
				cb(0)
			}
		}),
		stderr: {
			setEncoding: jest.fn(),
			on: jest.fn((ev, cb) => {

			})
		}
	}

	spawn.mockReturnValue(fakeStream)
})

test('throws stream not supported error', () => {
	return new Promise((resolve) => {
		// returns a read/write stream
		var stream = jekyll()
		stream.on('error', (err) => {
			expect(err).toEqual(new gutil.PluginError('gulp-jekyll', 'Streaming not supported'))
			resolve()
		})
		stream.write({ isStream: () => true })
	})
})

test('catches errors from spawned process', () => {
	fakeStream.on = jest.fn((ev, cb) => {
		cb(new gutil.PluginError('gulp-jekyll', new Error('some spawn error')))
	})
	return new Promise((resolve) => {
		var stream = jekyll()
		stream.on('error', (err) => {
			expect(err).toEqual(new gutil.PluginError('gulp-jekyll', new Error('some spawn error')))
			expect(spawn).toHaveBeenCalledWith('jekyll', ['build'])
			resolve()
		})
		stream.write({ isStream: () => false })
	})
})

test('sets encoding to utf8', () => {
	return new Promise((resolve) => {
		var stream = jekyll()
		stream.on('close', () => {
			expect(fakeStream.stderr.setEncoding).toHaveBeenCalledWith('utf8')
			expect(spawn).toHaveBeenCalledWith('jekyll', ['build'])
			resolve()
		})
		stream.write({ isStream: () => false })
		stream.destroy()
	})
})

test('allows for bundle exec', () => {
	return new Promise((resolve) => {
		var stream = jekyll({ bundleExec: true })
		stream.on('close', () => {
			expect(fakeStream.stderr.setEncoding).toHaveBeenCalledWith('utf8')
			expect(spawn).toHaveBeenCalledWith('bundle', ['exec', 'jekyll', 'build'])
			resolve()
		})
		stream.write({ isStream: () => false })
		stream.destroy()
	})
})

test('allows further jekyll commands ot be passed', () => {
	return new Promise((resolve) => {
		var stream = jekyll({ something: true })
		stream.on('close', () => {
			expect(fakeStream.stderr.setEncoding).toHaveBeenCalledWith('utf8')
			expect(spawn).toHaveBeenCalledWith('jekyll', ['build', '--something'])
			resolve()
		})
		stream.write({ isStream: () => false })
		stream.destroy()
	})
})

test('checks if jekyll is installed', () => {
	fakeStream.on = jest.fn((ev, cb) => {
		if (ev === 'close') {
			cb(127)
		}
	})
	return new Promise((resolve) => {
		var stream = jekyll()
		stream.on('error', (err) => {
			expect(err).toEqual(new gutil.PluginError('gulp-jekyll', 'You need to have Ruby and Jekyll installed and in your PATH for this task to work.'))
			resolve()
		})
		stream.write({ isStream: () => false })
		stream.destroy()
	})
})

test('throws an error if spawn stderr outputs', () => {
	fakeStream.stderr.on = jest.fn((ev, cb) => {
		cb('OMG Something went COMPLETELY WRONG!!!Use --trace for backtrace.\n')
	})
	return new Promise((resolve) => {
		var stream = jekyll()
		stream.on('error', (err) => {
			expect(err).toEqual(new gutil.PluginError('gulp-jekyll', '\nOMG Something went COMPLETELY WRONG!!!'))
			resolve()
		})
		stream.write({ isStream: () => false })
		stream.destroy()
	})
})

test('checks errors out if spawn returns non 0 code', () => {
	fakeStream.on = jest.fn((ev, cb) => {
		if (ev === 'close') {
			cb(1)
		}
	})
	return new Promise((resolve) => {
		var stream = jekyll()
		stream.on('error', (err) => {
			expect(err).toEqual(new gutil.PluginError('gulp-jekyll', 'Exited with error code 1'))
			resolve()
		})
		stream.write({ isStream: () => false })
		stream.destroy()
	})
})
