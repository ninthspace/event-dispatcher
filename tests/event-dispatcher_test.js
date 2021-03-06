import EventDispatcher from '../src/event-dispatcher';

/** @test {EventDispatcher} */
describe('EventDispatcher >', function() {
  const allowedEvents = ['allowed-event-1', 'allowed-event-2'];

  let inheritedEventTarget = null,
    mixedEventTarget = null,
    inheritedRestrictedEventTarget = null,
    mixedRestrictedEventTarget = null;

  beforeEach(function() {
    inheritedEventTarget = new EventDispatcher();
    mixedEventTarget = EventDispatcher.mixin({ ownMethod() {} });

    inheritedRestrictedEventTarget = new EventDispatcher(allowedEvents);
    mixedRestrictedEventTarget = EventDispatcher.mixin({ ownMethod() {} }, allowedEvents);
  });

  afterEach(function() {
    [inheritedEventTarget, mixedEventTarget, inheritedRestrictedEventTarget, mixedRestrictedEventTarget].forEach(
      (eventTarget) => {
        eventTarget.offAll();
      }
    );
  });

  /** @test {EventDispatcher#constructor} */
  describe('instantiation >', function() {
    it('throws if invalid array is passed for allowedEvents', function() {
      assert.throws(() => new EventDispatcher(null));
      assert.throws(() => new EventDispatcher('event'));
      assert.throws(() => new EventDispatcher(new Set()));

      // Mixin method.
      assert.throws(() => EventDispatcher.mixin(null));
      assert.throws(() => EventDispatcher.mixin('event'));
      assert.throws(() => EventDispatcher.mixin({}, new Set()));
    });

    it('mixin does not override existing methods', function() {
      assert.isTrue(typeof mixedEventTarget.ownMethod === 'function');
      assert.isTrue(typeof mixedRestrictedEventTarget.ownMethod === 'function');
    });

    it('mixin throws if target already has any of reserved methods', function() {
      ['on', 'once', 'off', 'offAll', 'emit', 'hasListeners'].forEach((method) => {
        assert.throws(() => EventDispatcher.mixin({ [method]: () => {}}));
      });
    });
  });

  /** @test {EventDispatcher#on} */
  describe('on >', function() {
    it('throws if event name is not valid string', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        assert.throws(() => eventTarget.on());
        assert.throws(() => eventTarget.on('', () => {}));
        assert.throws(() => eventTarget.on(null, () => {}));
      }
    });

    it('throws if handler is not function', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        assert.throws(() => eventTarget.on('event'));
        assert.throws(() => eventTarget.on('event', null));
        assert.throws(() => eventTarget.on('event', {}));
      }
    });

    it('successfully registers handler', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const expectedHandler = sinon.stub();
        const unexpectedHandler = sinon.stub();

        eventTarget.on('not-expected-event', unexpectedHandler);
        eventTarget.on('event', expectedHandler);

        eventTarget.emit('event');
        sinon.assert.calledOnce(expectedHandler);

        eventTarget.emit('event');
        sinon.assert.calledTwice(expectedHandler);
        sinon.assert.notCalled(unexpectedHandler);
      }
    });

    it('successfully registers multiple handlers', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const expectedHandler1 = sinon.stub();
        const expectedHandler2 = sinon.stub();
        const unexpectedHandler = sinon.stub();

        eventTarget.on('not-expected-event', unexpectedHandler);
        eventTarget.on('event', expectedHandler1);
        eventTarget.on('event', expectedHandler2);

        eventTarget.emit('event');

        sinon.assert.notCalled(unexpectedHandler);
        sinon.assert.calledOnce(expectedHandler1);
        sinon.assert.calledOnce(expectedHandler2);
        sinon.assert.callOrder(expectedHandler1, expectedHandler2);
      }
    });

    describe('with allowed events >', function() {
      it('throws if event name is not allowed', function() {
        for (const restrictedEventTarget of [inheritedRestrictedEventTarget, mixedRestrictedEventTarget]) {
          assert.throws(() => restrictedEventTarget.on('event'));
        }
      });

      it('successfully registers handler for allowed event', function() {
        for (const restrictedEventTarget of [inheritedRestrictedEventTarget, mixedRestrictedEventTarget]) {
          const expectedHandler = sinon.stub();
          const unexpectedHandler = sinon.stub();

          restrictedEventTarget.on('allowed-event-2', unexpectedHandler);
          restrictedEventTarget.on('allowed-event-1', expectedHandler);

          restrictedEventTarget.emit('allowed-event-1');
          sinon.assert.calledOnce(expectedHandler);

          restrictedEventTarget.emit('allowed-event-1');
          sinon.assert.calledTwice(expectedHandler);
          sinon.assert.notCalled(unexpectedHandler);
        }
      });
    });
  });

  /** @test {EventDispatcher#once} */
  describe('once >', function() {
    it('throws if event name is not valid string', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        assert.throws(() => eventTarget.once());
        assert.throws(() => eventTarget.once('', () => {}));
        assert.throws(() => eventTarget.once(null, () => {}));
      }
    });

    it('throws if handler is not function', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        assert.throws(() => eventTarget.once('event'));
        assert.throws(() => eventTarget.once('event', null));
        assert.throws(() => eventTarget.once('event', {}));
      }
    });

    it('successfully registers handler', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const expectedHandler = sinon.stub();
        const unexpectedHandler = sinon.stub();

        eventTarget.once('not-expected-event', unexpectedHandler);
        eventTarget.once('event', expectedHandler);

        eventTarget.emit('event');
        sinon.assert.calledOnce(expectedHandler);

        // Should not call handler more than once.
        eventTarget.emit('event');
        sinon.assert.calledOnce(expectedHandler);
        sinon.assert.notCalled(unexpectedHandler);
      }
    });

    it('successfully registers multiple handlers', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const expectedHandler1 = sinon.stub();
        const expectedHandler2 = sinon.stub();
        const unexpectedHandler = sinon.stub();

        eventTarget.once('not-expected-event', unexpectedHandler);
        eventTarget.once('event', expectedHandler1);
        eventTarget.once('event', expectedHandler2);

        eventTarget.emit('event');

        sinon.assert.notCalled(unexpectedHandler);
        sinon.assert.calledOnce(expectedHandler1);
        sinon.assert.calledOnce(expectedHandler2);
        sinon.assert.callOrder(expectedHandler1, expectedHandler2);
      }
    });

    it('correctly passes parameters', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const handler = sinon.stub();

        eventTarget.once('event', handler);
        eventTarget.emit('event');

        sinon.assert.calledOnce(handler);
        sinon.assert.calledWithExactly(handler, undefined);

        eventTarget.once('event', handler);
        eventTarget.emit('event', {a: 'b'});

        sinon.assert.calledTwice(handler);
        sinon.assert.calledWithExactly(handler, {a: 'b'});
      }
    });

    describe('with allowed events >', function() {
      it('throws if event name is not allowed', function() {
        for (const restrictedEventTarget of [inheritedRestrictedEventTarget, mixedRestrictedEventTarget]) {
          assert.throws(() => restrictedEventTarget.once('event'));
        }
      });

      it('successfully registers handler for allowed event', function() {
        for (const restrictedEventTarget of [inheritedRestrictedEventTarget, mixedRestrictedEventTarget]) {
          const expectedHandler = sinon.stub();
          const unexpectedHandler = sinon.stub();

          restrictedEventTarget.once('allowed-event-2', unexpectedHandler);
          restrictedEventTarget.once('allowed-event-1', expectedHandler);

          restrictedEventTarget.emit('allowed-event-1');
          sinon.assert.calledOnce(expectedHandler);

          // Should not call handler more than once.
          restrictedEventTarget.emit('allowed-event-1');
          sinon.assert.calledOnce(expectedHandler);
          sinon.assert.notCalled(unexpectedHandler);
        }
      });
    });
  });

  /** @test {EventDispatcher#off} */
  describe('off >', function() {
    it('throws if event name is not valid string', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        assert.throws(() => eventTarget.off());
        assert.throws(() => eventTarget.off('', () => {}));
        assert.throws(() => eventTarget.off(null, () => {}));
      }
    });

    it('throws if handler is not function', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        assert.throws(() => eventTarget.off('event'));
        assert.throws(() => eventTarget.off('event', null));
        assert.throws(() => eventTarget.off('event', {}));
      }
    });

    it('successfully unregisters handler', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const handler = sinon.stub();

        eventTarget.on('event', handler);
        eventTarget.emit('event');

        sinon.assert.calledOnce(handler);

        eventTarget.off('event', handler);
        eventTarget.emit('event');

        sinon.assert.calledOnce(handler);
      }
    });

    it('silently ignores not registered handler', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const handler = sinon.stub();

        eventTarget.on('event', handler);
        eventTarget.emit('event');

        sinon.assert.calledOnce(handler);

        // Just silently return for unknown event.
        eventTarget.off('unknown-event', handler);
        eventTarget.emit('event');

        sinon.assert.calledTwice(handler);

        eventTarget.off('event', handler);
        eventTarget.emit('event');

        // No handler is called this time.
        sinon.assert.calledTwice(handler);
      }
    });

    it('unregisters correct handler', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const handler1 = sinon.stub();
        const handler2 = sinon.stub();
        const handler3 = sinon.stub();

        eventTarget.on('event', handler1);
        eventTarget.on('event', handler2);
        eventTarget.emit('event');

        sinon.assert.calledOnce(handler1);
        sinon.assert.calledOnce(handler2);

        eventTarget.off('event', handler3);
        eventTarget.emit('event');

        sinon.assert.calledTwice(handler1);
        sinon.assert.calledTwice(handler2);

        eventTarget.off('event', handler1);
        eventTarget.emit('event');

        sinon.assert.calledTwice(handler1);
        sinon.assert.calledThrice(handler2);

        eventTarget.off('event', handler2);
        eventTarget.emit('event');

        sinon.assert.calledTwice(handler1);
        sinon.assert.calledThrice(handler2);
      }
    });

    describe('with allowed events >', function() {
      it('throws if event name is not allowed', function() {
        for (const restrictedEventTarget of [inheritedRestrictedEventTarget, mixedRestrictedEventTarget]) {
          assert.throws(() => restrictedEventTarget.off('event'));
        }
      });

      it('successfully unregisters handler for allowed event', function() {
        for (const restrictedEventTarget of [inheritedRestrictedEventTarget, mixedRestrictedEventTarget]) {
          const handler = sinon.stub();

          restrictedEventTarget.on('allowed-event-1', handler);
          restrictedEventTarget.emit('allowed-event-1');

          sinon.assert.calledOnce(handler);

          restrictedEventTarget.off('allowed-event-1', handler);
          restrictedEventTarget.emit('allowed-event-1');

          sinon.assert.calledOnce(handler);
        }
      });
    });
  });

  /** @test {EventDispatcher#offAll} */
  describe('offAll >', function() {
    it('throws if event name is not valid string', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        assert.throws(() => eventTarget.offAll(''));
        assert.throws(() => eventTarget.offAll(null));
      }
    });

    it('unregisters all handlers for a specific event', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const handler1 = sinon.stub();
        const handler2 = sinon.stub();

        eventTarget.on('event', handler1);
        eventTarget.on('event', handler2);
        eventTarget.emit('event');

        sinon.assert.calledOnce(handler1);
        sinon.assert.calledOnce(handler2);

        eventTarget.offAll('other-event');
        eventTarget.emit('event');

        sinon.assert.calledTwice(handler1);
        sinon.assert.calledTwice(handler2);

        eventTarget.offAll('event');
        eventTarget.emit('event');

        sinon.assert.calledTwice(handler1);
        sinon.assert.calledTwice(handler2);
      }
    });

    it('unregisters all handlers for all events', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const handler1 = sinon.stub();
        const handler2 = sinon.stub();
        const handler3 = sinon.stub();

        eventTarget.on('event-1', handler1);
        eventTarget.on('event-1', handler2);
        eventTarget.on('event-2', handler3);

        eventTarget.offAll();
        eventTarget.emit('event-1');
        eventTarget.emit('event-2');

        sinon.assert.notCalled(handler1);
        sinon.assert.notCalled(handler2);
        sinon.assert.notCalled(handler3);
      }
    });

    describe('with allowed events >', function() {
      it('throws if event name is not allowed', function() {
        for (const restrictedEventTarget of [inheritedRestrictedEventTarget, mixedRestrictedEventTarget]) {
          assert.throws(() => restrictedEventTarget.offAll('event'));
        }
      });

      it('successfully unregisters all handlers for allowed event',
        function() {
          for (const restrictedEventTarget of [inheritedRestrictedEventTarget, mixedRestrictedEventTarget]) {
            const handler1 = sinon.stub();
            const handler2 = sinon.stub();

            restrictedEventTarget.on('allowed-event-1', handler1);
            restrictedEventTarget.on('allowed-event-1', handler2);
            restrictedEventTarget.emit('allowed-event-1');

            sinon.assert.calledOnce(handler1);
            sinon.assert.calledOnce(handler2);

            restrictedEventTarget.offAll('allowed-event-2');
            restrictedEventTarget.emit('allowed-event-1');

            sinon.assert.calledTwice(handler1);
            sinon.assert.calledTwice(handler2);

            restrictedEventTarget.offAll('allowed-event-1');
            restrictedEventTarget.emit('allowed-event-1');

            sinon.assert.calledTwice(handler1);
            sinon.assert.calledTwice(handler2);
          }
        });
    });
  });

  /** @test {EventDispatcher#emit} */
  describe('emit >', function() {
    it('throws if event name is not valid string', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        assert.throws(() => eventTarget.emit());
        assert.throws(() => eventTarget.emit('', {}));
        assert.throws(() => eventTarget.emit(null, {}));
      }
    });

    it('execute all handlers in the right order', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const expectedHandler1 = sinon.stub();
        const expectedHandler2 = sinon.stub();
        const unexpectedHandler = sinon.stub();

        eventTarget.on('event', expectedHandler1);
        eventTarget.on('event', expectedHandler2);
        eventTarget.on('other-event', unexpectedHandler);

        eventTarget.emit('event');

        sinon.assert.notCalled(unexpectedHandler);
        sinon.assert.calledOnce(expectedHandler1);
        sinon.assert.calledOnce(expectedHandler2);
        sinon.assert.callOrder(expectedHandler1, expectedHandler2);
      }
    });

    it('passes correct parameters to the handlers', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const handler1 = sinon.stub();
        const handler2 = sinon.stub();
        const handler3 = sinon.stub();

        const parameters1 = {id: 1};

        const parameters2 = 'hello!';

        eventTarget.on('event', handler1);
        eventTarget.on('event-1', handler2);
        eventTarget.on('other-event', handler3);

        eventTarget.emit('event', parameters1);
        eventTarget.emit('event-1', parameters2);
        eventTarget.emit('other-event');

        sinon.assert.calledWith(handler1, parameters1);
        sinon.assert.calledWith(handler2, parameters2);
        sinon.assert.calledWith(handler3, undefined);
      }
    });

    it('execute all handlers even if exception occurs', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const handler1 = sinon.stub().throws('Type Error');
        const handler2 = sinon.stub();

        eventTarget.on('event', handler1);
        eventTarget.on('event', handler2);

        eventTarget.emit('event');

        sinon.assert.calledOnce(handler1);
        sinon.assert.calledOnce(handler2);
        sinon.assert.callOrder(handler1, handler2);
      }
    });

    describe('with allowed events >', function() {
      it('throws if event name is not allowed', function() {
        for (const restrictedEventTarget of [inheritedRestrictedEventTarget, mixedRestrictedEventTarget]) {
          assert.throws(() => restrictedEventTarget.emit('event'));
        }
      });

      it('execute all handlers for allowed event in the right order',
        function() {
          for (const restrictedEventTarget of [inheritedRestrictedEventTarget, mixedRestrictedEventTarget]) {
            const expectedHandler1 = sinon.stub();
            const expectedHandler2 = sinon.stub();
            const unexpectedHandler = sinon.stub();

            restrictedEventTarget.on('allowed-event-1', expectedHandler1);
            restrictedEventTarget.on('allowed-event-1', expectedHandler2);
            restrictedEventTarget.on('allowed-event-2', unexpectedHandler);

            restrictedEventTarget.emit('allowed-event-1');

            sinon.assert.notCalled(unexpectedHandler);
            sinon.assert.calledOnce(expectedHandler1);
            sinon.assert.calledOnce(expectedHandler2);
            sinon.assert.callOrder(expectedHandler1, expectedHandler2);
          }
        });
    });
  });

  /** @test {EventDispatcher#hasListeners} */
  describe('hasListeners >', function() {
    it('throws if event name is not valid string', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        assert.throws(() => eventTarget.hasListeners());
        assert.throws(() => eventTarget.hasListeners(''));
        assert.throws(() => eventTarget.hasListeners(null));
      }
    });

    it('correctly determines if any listeners are set', function() {
      for (const eventTarget of [inheritedEventTarget, mixedEventTarget]) {
        const handler1 = sinon.stub();
        const handler2 = sinon.stub();

        assert.isFalse(eventTarget.hasListeners('event'));
        assert.isFalse(eventTarget.hasListeners('other-event'));
        assert.isFalse(eventTarget.hasListeners('event-1'));

        eventTarget.on('event', handler1);
        eventTarget.on('other-event', handler2);

        assert.isTrue(eventTarget.hasListeners('event'));
        assert.isTrue(eventTarget.hasListeners('other-event'));
        assert.isFalse(eventTarget.hasListeners('event-1'));

        eventTarget.off('event', handler1);
        eventTarget.off('other-event', handler2);

        assert.isFalse(eventTarget.hasListeners('event'));
        assert.isFalse(eventTarget.hasListeners('other-event'));
        assert.isFalse(eventTarget.hasListeners('event-1'));
      }
    });

    describe('with allowed events >', function() {
      it('throws if event name is not allowed', function() {
        for (const restrictedEventTarget of [inheritedRestrictedEventTarget, mixedRestrictedEventTarget]) {
          assert.throws(() => restrictedEventTarget.hasListeners('event'));
        }
      });

      it('correctly determines if any listeners are set', function() {
        for (const restrictedEventTarget of [inheritedRestrictedEventTarget, mixedRestrictedEventTarget]) {
          const handler = sinon.stub();

          assert.isFalse(restrictedEventTarget.hasListeners('allowed-event-1'));

          restrictedEventTarget.on('allowed-event-1', handler);

          assert.isTrue(restrictedEventTarget.hasListeners('allowed-event-1'));

          restrictedEventTarget.off('allowed-event-1', handler);

          assert.isFalse(restrictedEventTarget.hasListeners('allowed-event-1'));
        }
      });
    });
  });
});
