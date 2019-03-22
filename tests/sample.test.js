function foo() {
  return 'ok'
}

test('test foo()', () => {
  expect(foo()).toBe('ok');
})