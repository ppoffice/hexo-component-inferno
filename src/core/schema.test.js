// const deepmerge = require('deepmerge');
const { MAGIC, DefaultValue } = require('./schema');

const PRIMARY_INPUTS = [null, false, true, 0, 1, '', '1'];

describe('DefaultValue class tests', () => {
    describe('#clone()', () => {
        test('Clone DefaultValue', () => {
            PRIMARY_INPUTS.forEach(val => {
                const result = new DefaultValue(val, 'source').clone();
                expect(result.description).toBe('source');
                expect(result.value).toBe(val);
            });

            let source = new DefaultValue([1, [2]], 'source');
            let result = source.clone();
            expect(result.value).not.toBe(source.value);
            expect(result.value).toEqual(source.value);
            expect(result.description).toBe(source.description);

            source = new DefaultValue({ a: 1, b: { c: 2 } }, 'source');
            result = source.clone();
            expect(result.value).not.toBe(source.value);
            expect(result.value).toEqual(source.value);
            expect(result.description).toBe(source.description);
        });

        test('Clone nested DefaultValue', () => {
            const source = new DefaultValue(new DefaultValue({ a: 1 }, 'child'), 'parent');
            const result = source.clone();
            expect(result.value instanceof DefaultValue).toBe(true);
            expect(result.value.value).not.toBe(source.value.value);
            expect(result.value.value).toEqual(source.value.value);
            expect(result.description).toBe(source.description);
            expect(result.value.description).toBe(source.value.description);
        });
    });

    describe('#flatten()', () => {
        test('Flatten nested DefaultValue', () => {
            const source = new DefaultValue(new DefaultValue({ a: 1 }, 'child'), 'parent');
            source.flatten();
            expect(source.description).toBe('child');
            expect(source.value).toEqual({ a: 1 });
        });

        test('Don\'t flatten DefaultValue is its value is not a DefaultValue', () => {
            const source = new DefaultValue({ value: new DefaultValue({ a: 1 }, 'child') }, 'parent');
            source.flatten();
            expect(source.description).toBe('parent');
            expect(source.value.value.description).toBe('child');
            expect(source.value.value.value).toEqual({ a: 1 });
        });
    });

    describe('#merge()', () => {
        test('Merge descriptions', () => {
            const target = new DefaultValue(true, 'val1');
            const source = new DefaultValue(true, 'val2');
            target.merge(source);
            expect(target.description).toBe('val2');
            source.description = '';
            target.merge(source);
            expect(target.description).toBe('val2');
            delete source.description;
            target.merge(source);
            expect(target.description).toBe('val2');
        });

        test('Merge another primary default value', () => {
            PRIMARY_INPUTS.forEach(val1 => {
                PRIMARY_INPUTS.forEach(val2 => {
                    const target = new DefaultValue(val1);
                    const source = new DefaultValue(val2);
                    target.merge(source);
                    if (typeof val1 === typeof val2 || val1 === null) {
                        expect(target.value).toBe(val2);
                    } else {
                        expect(target.value).toBe(val1);
                    }
                });
            });
        });

        test('Merge arrays', () => {
            const target = new DefaultValue([1, ['2']]);
            const source = new DefaultValue(['3', [4]]);
            target.merge(source);
            expect(target.value).toEqual([1, ['2'], '3', [4]]);
        });

        test('Merge objects', () => {
            const target = new DefaultValue({ a: 1, b: 2 });
            const source = new DefaultValue({ c: 3 });
            target.merge(source);
            expect(target.value).toEqual({ a: 1, b: 2, c: 3 });
            source.value = { a: 4, b: { d: 5 } };
            target.merge(source);
            expect(target.value).toEqual({ a: 4, b: { d: 5 }, c: 3 });
        });

        test('Recursive merge if .value is a DefaultValue', () => {
            const target = new DefaultValue(new DefaultValue({ a: 1 }));
            const source = new DefaultValue({ b: 2 });
            target.merge(source);
            expect(target.value).toEqual({ a: 1, b: 2 });
            source.value = new DefaultValue({ c: 3 }, 'child');
            target.merge(source);
            expect(target.description).toEqual('child');
            expect(target.value).toEqual({ a: 1, b: 2, c: 3 });
            target.value = { a: 1 };
            target.merge(source);
            expect(target.value).toEqual({ a: 1, c: 3 });
        });
    });

    describe('#toCommented()', () => {
        test('Primary DefaultValue', () => {
            PRIMARY_INPUTS.forEach(val => {
                const source = new DefaultValue(val, 'source');
                expect(source.toCommented()).toBe(val);
            });
        });

        test('Nested DefaultValue', () => {
            const source = new DefaultValue(new DefaultValue(1, 'child'), 'parent');
            expect(source.toCommented()).toBe(1);
        });

        test('#toCommentedArray()', () => {
            const source = new DefaultValue([
                0,
                new DefaultValue(1, 'child-1'),
                2,
                new DefaultValue(3, 'child-3\nchild-4')
            ], 'parent');
            expect(source.toCommented()).toEqual(source.toCommentedArray());
            expect(source.toCommented()).toEqual([
                0, MAGIC + '0: child-1', 1, 2, MAGIC + '0: child-3', MAGIC + '1: child-4', 3
            ]);
        });

        test('#toCommentedObject()', () => {
            const source = new DefaultValue({
                a: 0,
                b: new DefaultValue(1, 'child-1'),
                c: 2,
                d: new DefaultValue(3, 'child-3\nchild-4')
            }, 'parent');
            expect(source.toCommented()).toEqual(source.toCommentedObject());
            expect(source.toCommented()).toEqual({
                a: 0,
                [MAGIC + 'b0']: 'child-1',
                b: 1,
                c: 2,
                [MAGIC + 'd0']: 'child-3',
                [MAGIC + 'd1']: 'child-4',
                d: 3
            });
        });

        test('Complex cases', () => {
            let source = new DefaultValue({
                a: [0, new DefaultValue(1, 'child-1')]
            }, 'parent');
            expect(source.toCommented()).toEqual({ a: [0, MAGIC + '0: child-1', 1] });
            source = new DefaultValue([
                0,
                { a: new DefaultValue(1, 'child-1') }
            ], 'parent');
            expect(source.toCommented()).toEqual([0, { [MAGIC + 'a0']: 'child-1', a: 1 }]);
        });
    });

    describe('#toYaml()', () => {
        const source = new DefaultValue({
            a: new DefaultValue(1, 'child-1'),
            b: new DefaultValue(2, 'child-2\nchild-3'),
            c: 0,
            d: [0, new DefaultValue(3, 'child-4')],
            e: { f: 4, g: new DefaultValue(5, 'child-5') },
            h: new DefaultValue(1)
        }, 'parent');
        expect(source.toYaml()).toEqual('# child-1\na: 1\n# child-2\n# child-3\nb: 2\nc: 0\nd:\n    - 0'
            + '\n    # child-4\n    - 3\ne:\n    f: 4\n    # child-5\n    g: 5\nh: 1\n');
    });
});
