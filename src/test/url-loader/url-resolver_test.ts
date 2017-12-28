/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {assert} from 'chai';

import {FileRelativeUrl, PackageRelativeUrl, ResolvedUrl} from '../../index';
import {UrlResolver} from '../../url-loader/url-resolver';

class SimplestUrlResolver extends UrlResolver {
  resolve(
      url: FileRelativeUrl|PackageRelativeUrl,
      baseUrl: ResolvedUrl = '/test/' as ResolvedUrl) {
    return this.simpleUrlResolve(url, baseUrl);
  }

  relative(fromOrTo: ResolvedUrl, maybeTo?: ResolvedUrl, _kind?: string):
      FileRelativeUrl {
    let from, to;
    if (maybeTo !== undefined) {
      from = fromOrTo;
      to = maybeTo;
    } else {
      throw new Error(
          'simplest url resolver.relative must be called with two arguments');
    }
    return this.simpleUrlRelative(from, to);
  }
}

suite('UrlResolver', () => {
  suite('resolve', () => {
    const resolver = new SimplestUrlResolver();
    function resolve(url: string, baseUrl: string) {
      return resolver.resolve(url as FileRelativeUrl, baseUrl as ResolvedUrl);
    }
    test('can resolve a url when relative url contains no pathname', () => {
      assert.equal(resolve('', '/foo.html?fiz#buz'), '/foo.html?fiz');
      assert.equal(resolve('#fiz', '/foo.html'), '/foo.html#fiz');
      assert.equal(resolve('#fiz', '/foo.html#buz'), '/foo.html#fiz');
      assert.equal(resolve('?fiz', '/foo.html'), '/foo.html?fiz');
      assert.equal(resolve('?fiz', '/foo.html?buz'), '/foo.html?fiz');
      assert.equal(resolve(`?fiz`, `/foo.html?bar#buz`), `/foo.html?fiz`);
    });
  });

  suite('relative', () => {
    const resolver = new SimplestUrlResolver();
    function relative(from: string, to: string) {
      const fromResolved = resolver.resolve(from as FileRelativeUrl);
      const toResolved = resolver.resolve(to as FileRelativeUrl);
      return resolver.relative(fromResolved, toResolved);
    }

    test('can get relative urls between urls', () => {
      assert.equal(relative('/', '/'), '');
      assert.equal(relative('/', '/bar/'), 'bar/');
      assert.equal(relative('/foo/', '/foo/'), '');
      assert.equal(relative('/foo/', '/bar/'), '../bar/');
      assert.equal(relative('foo/', '/'), '../../');  // 'foo/' ~> '/test/foo/'
      assert.equal(relative('foo.html', 'foo.html'), '');
      assert.equal(relative('foo/', 'bar/'), '../bar/');
      assert.equal(relative('foo.html', 'bar.html'), 'bar.html');
      assert.equal(relative('sub/foo.html', 'bar.html'), '../bar.html');
      assert.equal(
          relative('sub1/foo.html', 'sub2/bar.html'), '../sub2/bar.html');
      assert.equal(relative('foo.html', 'sub/bar.html'), 'sub/bar.html');
      assert.equal(relative('./foo.html', './sub/bar.html'), 'sub/bar.html');
      assert.equal(relative('./foo.html', './bar.html'), 'bar.html');
      assert.equal(relative('./foo/', 'sub/bar.html'), '../sub/bar.html');
      assert.equal(relative('./foo/bonk.html', 'sub/bar/'), '../sub/bar/');
    });

    test('preserves target url querystrings and fragments', () => {
      assert.equal(relative('foo.html', 'foo.html?fiz=buz'), '?fiz=buz');
      assert.equal(
          relative('foo.html', 'bar.html?fiz=buz'), 'bar.html?fiz=buz');
      assert.equal(relative('foo.html?fiz=buz', 'foo.html'), '');
      assert.equal(relative('foo.html', 'foo.html#fiz'), '#fiz');
    });

    test('will keep absolute urls absolute', () => {
      assert.equal(
          relative('foo/', 'http://example.com'), 'http://example.com/');
      assert.equal(
          relative('foo/', 'https://example.com'), 'https://example.com/');
      assert.equal(
          relative('foo/', 'file://host/path/to/file'),
          'file://host/path/to/file');
    });

    test('sibling urls work properly', () => {
      assert.equal(relative('foo.html', '../bar/bar.html'), '../bar/bar.html');
      assert.equal(
          relative('foo/foo.html', '../bar/bar.html'), '../../bar/bar.html');
      assert.equal(
          relative('../foo/foo.html', '../bar/bar.html'), '../bar/bar.html');
    });
  });
});