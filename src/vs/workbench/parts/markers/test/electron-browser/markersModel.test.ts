/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as assert from 'assert';
import URI from 'vs/base/common/uri';
import { IMarker, MarkerSeverity } from 'vs/platform/markers/common/markers';
import { MarkersModel, Marker, Resource } from 'vs/workbench/parts/markers/electron-browser/markersModel';

class TestMarkersModel extends MarkersModel {

	get filteredResources(): Resource[] {
		let res: Resource[] = [];
		this.forEachFilteredResource(resource => res.push(resource));
		return res;
	}

	static compare(a: any, b: any): number {
		if (a instanceof Resource && b instanceof Resource) {
			return Resource.compare(a, b);
		}
		if (a instanceof Marker && b instanceof Marker) {
			return Marker.compare(a, b);
		}
		return 0;
	}
}

suite('MarkersModel Test', () => {

	test('getFilteredResource return markers grouped by resource', function () {
		let marker1 = aMarker('res1');
		let marker2 = aMarker('res2');
		let marker3 = aMarker('res1');
		let marker4 = aMarker('res3');
		let marker5 = aMarker('res4');
		let marker6 = aMarker('res2');
		let testObject = new TestMarkersModel([marker1, marker2, marker3, marker4, marker5, marker6]);

		let actuals = testObject.filteredResources;

		assert.equal(4, actuals.length);

		assert.ok(compareResource(actuals[0], 'res1'));
		assert.equal(2, actuals[0].markers.length);
		assert.ok(hasMarker(actuals[0].markers, marker1));
		assert.ok(hasMarker(actuals[0].markers, marker3));

		assert.ok(compareResource(actuals[1], 'res2'));
		assert.equal(2, actuals[1].markers.length);
		assert.ok(hasMarker(actuals[1].markers, marker2));
		assert.ok(hasMarker(actuals[1].markers, marker6));

		assert.ok(compareResource(actuals[2], 'res3'));
		assert.equal(1, actuals[2].markers.length);
		assert.ok(hasMarker(actuals[2].markers, marker4));

		assert.ok(compareResource(actuals[3], 'res4'));
		assert.equal(1, actuals[3].markers.length);
		assert.ok(hasMarker(actuals[3].markers, marker5));
	});

	test('sort palces resources with no errors at the end', function () {
		let marker1 = aMarker('a/res1', MarkerSeverity.Warning);
		let marker2 = aMarker('a/res2');
		let marker3 = aMarker('res4');
		let marker4 = aMarker('b/res3');
		let marker5 = aMarker('res4');
		let marker6 = aMarker('c/res2', MarkerSeverity.Info);
		let testObject = new TestMarkersModel([marker1, marker2, marker3, marker4, marker5, marker6]);

		let actuals = testObject.filteredResources.sort(TestMarkersModel.compare);

		assert.equal(5, actuals.length);
		assert.ok(compareResource(actuals[0], 'a/res2'));
		assert.ok(compareResource(actuals[1], 'b/res3'));
		assert.ok(compareResource(actuals[2], 'res4'));
		assert.ok(compareResource(actuals[3], 'a/res1'));
		assert.ok(compareResource(actuals[4], 'c/res2'));
	});

	test('sort resources by file path', function () {
		let marker1 = aMarker('a/res1');
		let marker2 = aMarker('a/res2');
		let marker3 = aMarker('res4');
		let marker4 = aMarker('b/res3');
		let marker5 = aMarker('res4');
		let marker6 = aMarker('c/res2');
		let testObject = new TestMarkersModel([marker1, marker2, marker3, marker4, marker5, marker6]);

		let actuals = testObject.filteredResources.sort(TestMarkersModel.compare);

		assert.equal(5, actuals.length);
		assert.ok(compareResource(actuals[0], 'a/res1'));
		assert.ok(compareResource(actuals[1], 'a/res2'));
		assert.ok(compareResource(actuals[2], 'b/res3'));
		assert.ok(compareResource(actuals[3], 'c/res2'));
		assert.ok(compareResource(actuals[4], 'res4'));
	});

	test('sort markers by severity, line and column', function () {
		let marker1 = aWarningWithRange(8, 1, 9, 3);
		let marker2 = aWarningWithRange(3);
		let marker3 = anErrorWithRange(8, 1, 9, 3);
		let marker4 = anIgnoreWithRange(5);
		let marker5 = anInfoWithRange(8, 1, 8, 4, 'ab');
		let marker6 = anErrorWithRange(3);
		let marker7 = anErrorWithRange(5);
		let marker8 = anInfoWithRange(5);
		let marker9 = anErrorWithRange(8, 1, 8, 4, 'ab');
		let marker10 = anErrorWithRange(10);
		let marker11 = anErrorWithRange(8, 1, 8, 4, 'ba');
		let marker12 = anIgnoreWithRange(3);
		let marker13 = aWarningWithRange(5);
		let marker14 = anErrorWithRange(4);
		let marker15 = anErrorWithRange(8, 2, 8, 4);
		let testObject = new TestMarkersModel([marker1, marker2, marker3, marker4, marker5, marker6, marker7, marker8, marker9, marker10, marker11, marker12, marker13, marker14, marker15]);

		let actuals = testObject.filteredResources[0].markers.sort(TestMarkersModel.compare);

		assert.equal(actuals[0].raw, marker6);
		assert.equal(actuals[1].raw, marker14);
		assert.equal(actuals[2].raw, marker7);
		assert.equal(actuals[3].raw, marker9);
		assert.equal(actuals[4].raw, marker11);
		assert.equal(actuals[5].raw, marker3);
		assert.equal(actuals[6].raw, marker15);
		assert.equal(actuals[7].raw, marker10);
		assert.equal(actuals[8].raw, marker2);
		assert.equal(actuals[9].raw, marker13);
		assert.equal(actuals[10].raw, marker1);
		assert.equal(actuals[11].raw, marker8);
		assert.equal(actuals[12].raw, marker5);
		assert.equal(actuals[13].raw, marker12);
		assert.equal(actuals[14].raw, marker4);
	});

	test('toString()', function () {
		const res1Marker = aMarker('a/res1');
		res1Marker.code = '1234';
		assert.equal(`file: 'file:///a/res1'\nseverity: 'Error'\nmessage: 'some message'\nat: '10,5'\nsource: 'tslint'\ncode: '1234'`, new Marker('', res1Marker).toString());
		assert.equal(`file: 'file:///a/res2'\nseverity: 'Warning'\nmessage: 'some message'\nat: '10,5'\nsource: 'tslint'\ncode: ''`, new Marker('', aMarker('a/res2', MarkerSeverity.Warning)).toString());
		assert.equal(`file: 'file:///a/res2'\nseverity: 'Info'\nmessage: 'Info'\nat: '1,2'\nsource: ''\ncode: ''`, new Marker('', aMarker('a/res2', MarkerSeverity.Info, 1, 2, 1, 8, 'Info', '')).toString());
		assert.equal(`file: 'file:///a/res2'\nseverity: ''\nmessage: 'Ignore message'\nat: '1,2'\nsource: 'Ignore'\ncode: ''`, new Marker('', aMarker('a/res2', MarkerSeverity.Hint, 1, 2, 1, 8, 'Ignore message', 'Ignore')).toString());
	});

	function hasMarker(markers: Marker[], marker: IMarker): boolean {
		return markers.filter((m): boolean => {
			return m.raw === marker;
		}).length === 1;
	}

	function compareResource(a: Resource, b: string): boolean {
		return a.uri.toString() === URI.file(b).toString();
	}

	function anErrorWithRange(startLineNumber: number = 10,
		startColumn: number = 5,
		endLineNumber: number = startLineNumber + 1,
		endColumn: number = startColumn + 5,
		message: string = 'some message',
	): IMarker {
		return aMarker('some resource', MarkerSeverity.Error, startLineNumber, startColumn, endLineNumber, endColumn, message);
	}

	function aWarningWithRange(startLineNumber: number = 10,
		startColumn: number = 5,
		endLineNumber: number = startLineNumber + 1,
		endColumn: number = startColumn + 5,
		message: string = 'some message',
	): IMarker {
		return aMarker('some resource', MarkerSeverity.Warning, startLineNumber, startColumn, endLineNumber, endColumn, message);
	}

	function anInfoWithRange(startLineNumber: number = 10,
		startColumn: number = 5,
		endLineNumber: number = startLineNumber + 1,
		endColumn: number = startColumn + 5,
		message: string = 'some message',
	): IMarker {
		return aMarker('some resource', MarkerSeverity.Info, startLineNumber, startColumn, endLineNumber, endColumn, message);
	}

	function anIgnoreWithRange(startLineNumber: number = 10,
		startColumn: number = 5,
		endLineNumber: number = startLineNumber + 1,
		endColumn: number = startColumn + 5,
		message: string = 'some message',
	): IMarker {
		return aMarker('some resource', MarkerSeverity.Hint, startLineNumber, startColumn, endLineNumber, endColumn, message);
	}

	function aMarker(resource: string = 'some resource',
		severity: MarkerSeverity = MarkerSeverity.Error,
		startLineNumber: number = 10,
		startColumn: number = 5,
		endLineNumber: number = startLineNumber + 1,
		endColumn: number = startColumn + 5,
		message: string = 'some message',
		source: string = 'tslint'
	): IMarker {
		return {
			owner: 'someOwner',
			resource: URI.file(resource),
			severity,
			message,
			startLineNumber,
			startColumn,
			endLineNumber,
			endColumn,
			source
		};
	}
});
