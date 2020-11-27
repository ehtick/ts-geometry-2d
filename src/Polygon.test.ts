import { Point, point } from './Point';
import { vector, Vector } from './Vector';
import { Polygon, polygon, lineSegmentsIntersectThemselves, isClockwise } from './Polygon';
import { LineSegment } from './LineSegment';
import { none, some } from '@ruffy/ts-optional';
import { rectangle } from './Rectangle';

let pol: Polygon = polygon([]);

beforeEach(() => {
  pol = polygon([[0, 0], [0, 1], [1, 1], [1, 0]]);
});

test('constructor should initialize polygon', () => {
  expect(pol.lineSegments.length).toBe(4);
});

test('constructor should guarantee that line segments are clockwise oriented', () => {
  const pol = polygon([[0, 0], [1, 0], [1, 1], [0, 1]]);

  expect(pol.lineSegments.find(
      equalLineSegment(0, 0, 0, 1)),
  ).toBeDefined();
});

test('constructor should throw exception if polygon intersects itself', () => {
  expect(() => {
    const pol = polygon([[0, 0], [1, 1], [1, 0], [0, 1]]);
  }).toThrow();
});

test('containsPoints should return true if point is inside Polygon.', () => {
  const pol = polygon([[0, 0], [1, 0], [1, 1], [0, 1]]);
  expect(pol.containsPoint(Point.fromValues(0.5, 0.5))).toBeTruthy();
});

test('containsPoint should return false if point is one border of Polygon.', () => {
  const pol = polygon([[0, 0], [1, 0], [1, 1], [0, 1]]);
  expect(pol.containsPoint(point(0, 0))).toBeFalsy();
  expect(pol.containsPoint(point(1, 0))).toBeFalsy();
  expect(pol.containsPoint(point(0, 1))).toBeFalsy();
  expect(pol.containsPoint(point(1, 1))).toBeFalsy();
  expect(pol.containsPoint(point(0, 0.5))).toBeFalsy();
  expect(pol.containsPoint(point(0.5, 0))).toBeFalsy();
  expect(pol.containsPoint(point(1, 0.5))).toBeFalsy();
  expect(pol.containsPoint(point(0.5, 1))).toBeFalsy();
});

test('containsPoint should return false if point is outside', () => {
  const pol = polygon([[0, 0], [1, 0], [1, 1], [0, 1]]);
  expect(pol.containsPoint(Point.fromValues(-0.5, 0.5))).toBeFalsy();
  expect(pol.containsPoint(Point.fromValues(1.5, 0.5))).toBeFalsy();
  expect(pol.containsPoint(Point.fromValues(0.5, -0.5))).toBeFalsy();
  expect(pol.containsPoint(Point.fromValues(0.5, 1.5))).toBeFalsy();
});

test('containsPoint should return false if point is tangent to line', () => {
  const pol = polygon([[0, 0], [1, 0], [1, 1], [0, 1]]);
  expect(pol.containsPoint(Point.fromValues(-0.5, 1))).toBeFalsy();
});

test('equals should return true when points are the same', () => {
  const pol = polygon([[0, 0], [0, 1], [1, 1], [1, 0]]);
  expect(pol.equals(pol)).toBeTruthy();
  const otherPol = pol.transpose(0, 0);
  expect(pol.equals(otherPol)).toBeTruthy();
});

test('equals should return false when points are not the same', () => {
  const pol = polygon([[0, 0], [0, 1], [1, 1], [1, 0]]);
  const pol2 = polygon([[0, 0], [0, 1], [1, 1], [1, 0], [0.5, -1]]);
  expect(pol.transpose(0.5, 0).equals(pol)).toBeFalsy();
  expect(pol.equals(pol2)).toBeFalsy();
});

test('getBounds should return bounds that encompasses polygon', () => {
  const pol = polygon([[1, 0], [2, 1], [1, 2], [0, 1]]);

  expect(pol.getBounds()).toEqual(rectangle(0, 0, 2, 2));
});

test('swell should return a new bigger polygon.', () => {
  const newPol = pol.swell(1);

  const expectedPolygon = polygon(
    [
            [-1, -1],
            [-1, 2],
            [2, 2],
            [2, -1],
    ]);

  expect(newPol.lineSegmentsAsSet()).toEqual(expectedPolygon.lineSegmentsAsSet());
});

test('merge should throw error if no overlap', () => {
  const pol1 = polygon(
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
  );
  const pol2 = pol1.transpose(2, 0);

  expect(() => pol1.merge(pol2)).toThrow;
});

test('merge should return containing polygon if one contains the other.', () => {
  const swelled = pol.swell(5);

  expect(pol.merge(swelled)).toBe(swelled);
  expect(swelled.merge(pol)).toBe(swelled);
});

test('merge should merge two diamond polygons', () => {
  const pol1 = polygon(
    [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ],
  );
  const pol2 = pol1.transpose(1, 0);

  expect(pol1.merge(pol2).lineSegments.length).toBe(8);
});

test('nextLineSegment should throw error if line segment not in polygon', () => {
  expect(() => pol.nextLineSegment(LineSegment.fromValues(0, 0, 4, 4))).toThrow();
});

test('nextLineSegment should return the next line segment in order', () => {
  expect(pol.nextLineSegment(pol.lineSegments[0])).toBe(pol.lineSegments[1]);
  expect(pol.nextLineSegment(pol.lineSegments[1])).toBe(pol.lineSegments[2]);
  expect(pol.nextLineSegment(pol.lineSegments[2])).toBe(pol.lineSegments[3]);
  expect(pol.nextLineSegment(pol.lineSegments[3])).toBe(pol.lineSegments[0]);
});

test('intersectionSegmentAndPoints should return empty set if not intersection', () => {
  expect(pol.intersectionSegmentAndPoints(
    LineSegment.fromValues(-1, -1, -1, 0))).toEqual(new Set());
  expect(pol.intersectionSegmentAndPoints(
    LineSegment.fromValues(-1, -1, -2, -1))).toEqual(new Set());
});

test('intersectionSegmentAndPoints should return all intersecting points', () => {
  expect(pol.intersectionSegmentAndPoints(LineSegment.fromValues(-1, 0.5, 2, 0.5)))
    .toEqual(new Set([[pol.lineSegments[0], Point.fromValues(0, 0.5)],
                       [pol.lineSegments[2], Point.fromValues(1, 0.5)]]));
});

test('intersect should return empty set if not intersection', () => {
  expect(pol.intersect(LineSegment.fromValues(-1, -1, -1, 0))).toEqual(new Set());
  expect(pol.intersect(LineSegment.fromValues(-1, -1, -2, -1))).toEqual(new Set());
});

test('intersect should return all intersecting points', () => {
  expect(pol.intersect(LineSegment.fromValues(-1, 0.5, 2, 0.5)))
    .toEqual(new Set([Point.fromValues(0, 0.5),
      Point.fromValues(1, 0.5)]));
});

test('intersect should return two intersecting points', () => {
  const pol1 = polygon(
    [
      [482, 180],
      [482, 424],
      [680, 424],
      [680, 180],
    ]);
  const diagonal = LineSegment.fromValues(317, 180, 803, 424);

  expect(pol1.intersect(diagonal).size).toEqual(2);
});

test('closestPoint should return closest point on perimiter.', () => {
  const pol1 = polygon(
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]);

  expect(pol1.closestPoint(new Point(-5, 5))).toEqual(new Point(0, 5));
  expect(pol1.closestPoint(new Point(15, 5))).toEqual(new Point(10, 5));
  expect(pol1.closestPoint(new Point(5, 15))).toEqual(new Point(5, 10));
  expect(pol1.closestPoint(new Point(5, -5))).toEqual(new Point(5, 0));
});

test('separateFrom should return given polygon if no overlap found.', () => {
  const pol2 = pol.transpose(3, 0);

  expect(pol.separateFrom(pol2, vector(1, 0))).toEqual(pol);
});

[
  { direction: vector(1, 0), expectedMove: vector(1, 0) },
  { direction: vector(2, 0), expectedMove: vector(1, 0) },
].forEach(({ direction, expectedMove }) => {
  test(`separateFrom should move polygon in direction ${direction}`, () => {
    expect(pol.separateFrom(pol, direction)).toEqual(
      pol.transposeVector(expectedMove));
  });
});

[
  { direction: vector(1, 0), expectedMove: vector(2, 0) },
].forEach(({ direction, expectedMove }) => {
  test(`separateFrom should manage complicated shapes in direction ${direction}.`, () => {
    const pol1 = rectangle(0, 0, 2, 2).toPolygon();
    const pol2 = polygon([[1, 0], [2, 1], [1, 2], [0, 1]]);

    const result = pol2.separateFrom(pol1, direction);
    expect(result.equals(pol2.transposeVector(expectedMove)))
      .toBeTruthy();
  });
});

test('getBounds should return outer bounds', () => {
  const pol = polygon([[1, 0], [2, 1], [1, 2], [0, 1]]);

  expect(pol.getBounds()).toEqual(rectangle(0, 0, 2, 2));
  expect(rectangle(0, 0, 2, 2).toPolygon().getBounds()).toEqual(rectangle(0, 0, 2, 2));
});

[
  { p: point(0, 0), v: vector(1, 0), expected: some(0) },
  { p: point(1, 0), v: vector(1, 0), expected: some(1) },
  { p: point(-5, 0), v: vector(1, 0), expected: some(5) },
  { p: point(0, -5), v: vector(0, 1), expected: some(5) },
  { p: point(0, 5), v: vector(0, 1), expected: none },
].forEach(({ p, v, expected }) => {
  test(`distanceToPerimiter should give ${expected} when going from ${p} in direction ${v}.`,
       () => {
         const pol = rectangle(0, 0, 2, 2).toPolygon();

         const result = pol.distanceToPerimiter(p, v);

         expect(result).toEqual(expected);
       });
});

[
  { direction: vector(1, 0), expected: vector(0.5, 0) },
  { direction: vector(-1, 0), expected: vector(-0.5, 0) },
  { direction: vector(0, 2), expected: vector(0, 0.5) },
].forEach(({ direction, expected }) => {
  test(`furthestProjection should be ${expected} for ${direction}`, () => {
    expect(pol.furthestProjection(direction)).toEqual(expected);
  });
});

test('middle should find middle of polygon', () => {
  expect(polygon(
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]).middle())
    .toEqual(new Point(5, 5));

  expect(polygon(
    [
      [0, 100],
      [100, 50],
      [10, 50],
      [10, 10],
    ]).middle())
    .toEqual(new Point(50, 55));
});

test('firstIntersectionSegmentAndPoint should return none if no intersect', () => {
  const ls = LineSegment.fromValues(-1, -1, -2, -1);
  expect(pol.firstIntersectionSegmentAndPoint(ls))
    .toEqual(none);
});

test('firstIntersectionSegmentAndPoint should return closest point to p1 when multiple intercepts',
     () => {
       expect(pol.firstIntersectionSegmentAndPoint(LineSegment
                                             .fromValues(-1, 0.5, 2, 0.5)))
    .toEqual(some([pol.lineSegments[0], Point.fromValues(0, 0.5)]));
     });

test('lineSegmentFromPoint should return line segment ends at point p', () => {
  pol.lineSegments.forEach(ls => expect(pol.lineSegmentFrom(ls.p1)).toBe(ls));
});

test('lineSegmentFromPoint should throw error if no line segment exists.', () => {
  expect(() => pol.lineSegmentFrom(Point.fromValues(-1, -1))).toThrow();
});

test('firstIntersection should return none if no intersect', () => {
  const ls = LineSegment.fromValues(-1, -1, -2, -1);
  expect(pol.firstIntersection(ls))
    .toBe(none);
});

test('firstIntersection should return closest point to p1 when multiple intercepts', () => {
  expect(pol.firstIntersection(LineSegment.fromValues(-1, 0.5, 2, 0.5)))
    .toEqual(some(Point.fromValues(0, 0.5)));
});

test('overlap should return false when polygons are separate', () => {
  expect(polygon(
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]).overlap(
    polygon([
      [3, 0],
      [4, 0],
      [4, 1],
      [3, 1],
    ]))).toBeFalsy();
});

test('overlap should be true for self', () => {
  const poly = polygon(
    [
      [0, 0],
      [20, 0],
      [20, 20],
      [0, 20],
    ]);
  expect(poly.overlap(poly)).toBeTruthy();
});

test('overlap should return true when polygons contain each other', () => {
  const pol1 = polygon(
    [
      [0, 0],
      [20, 0],
      [20, 20],
      [0, 20],
    ]);

  const pol2 = polygon([
      [1, 1],
      [2, 1],
      [2, 2],
      [1, 2],
  ]);
  expect(pol1.overlap(pol2)).toBeTruthy();
  expect(pol2.overlap(pol1)).toBeTruthy();
});

test('overlap should return true when polygon lines intersect', () => {
  const pol1 = polygon(
    [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ]);
  let pol2 = pol1.transpose(-1, 0);

  expect(pol1.overlap(pol2)).toBeTruthy();
  expect(pol2.overlap(pol1)).toBeTruthy();

  pol2 = polygon(
    [
      [-1, 0],
      [4, 0],
      [4, 1],
      [-1, 1],
    ]);
  expect(pol1.overlap(pol2)).toBeTruthy();
});

test('overlap should return false when polygons are adjacent', () => {
  const pol1 = polygon(
    [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ]);
  const pol2 = pol1.transpose(-2, 0);
  expect(pol1.overlap(pol2)).toBeFalsy();
});

test('transpose keeps orientation of lines', () => {
  const pol = polygon([[0, 0], [0, 1], [1, 1], [1, 0]]);
  const newPol = pol.transpose(0, 0);
  expect(pol.equals(newPol)).toBeTruthy();
});

test('lineSegmentsIntersectThemselves should return false for simple square', () => {
  const points = [[0, 0], [0, 1], [1, 1], [1, 0]].map(p => point(p[0], p[1]));
  const lineSegments = points.reduce((a: LineSegment[], v, i) => {
    const nextIndex = (i + 1) % points.length;
    const ls = new LineSegment(points[i], points[nextIndex]);
    a.push(ls);
    return a;
  },                                 []);

  expect(lineSegmentsIntersectThemselves(lineSegments)).toBeFalsy();
});

test('isClockwise should be false when not clockwise', () => {
  const points = [[0, 0], [1, 0], [1, 1], [0, 1]].map(p => point(p[0], p[1]));
  const lineSegments = points.reduce((a: LineSegment[], v, i) => {
    const nextIndex = (i + 1) % points.length;
    const ls = new LineSegment(points[i], points[nextIndex]);
    a.push(ls);
    return a;
  },                                 []);

  expect(isClockwise(lineSegments)).toBeFalsy();
});

test('isClockwise should be true when clockwise', () => {
  const points = [[0, 0], [0, 1], [1, 1], [1, 0]].map(p => point(p[0], p[1]));
  const lineSegments = points.reduce((a: LineSegment[], v, i) => {
    const nextIndex = (i + 1) % points.length;
    const ls = new LineSegment(points[i], points[nextIndex]);
    a.push(ls);
    return a;
  },                                 []);

  expect(isClockwise(lineSegments)).toBeTruthy();
});

function equalLineSegment(x1: number, y1: number, x2: number, y2: number) {
  return (lineSegment: LineSegment) => lineSegment.p1.x === x1
    && lineSegment.p1.y === y1
        && lineSegment.p2.x === x2
        && lineSegment.p2.y === y2;
}
