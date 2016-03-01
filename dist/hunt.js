(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return factory();
        });
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root.hunt = factory();
    }
})(this, function() {
    'use strict';

    var huntedElements = [],
        delay = window.hunt && window.hunt.debounce || 0,
        viewport = window.innerHeight,
        frame,
        time;

    // requestAnimationFrame and cancelAnimationFrame placeholders
    var rAF = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame;
    })();

    var cAF = (function() {
        return window.cancelAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            window.mozCancelAnimationFrame;
    })();

    /*
     * Constructor for element to be hunted
     * @constructor Hunted
     * @param {Node} element
     * @param {Object} options
     * @returns undefined
     */
    var Hunted = function(element, config) {
        this.element = element;

        // instantiate element as not visible
        this.visible = false;

        for (var prop in config) {
            if (config.hasOwnProperty(prop)) {
                this[prop] = config[prop];
            }
        }
    };

    // by default offset is zero
    Hunted.prototype.offset = 0;

    // by default trigger events only once
    Hunted.prototype.persist = false;

    // fallback in function to avoid sanity check
    Hunted.prototype.in = function() {};

    // fallback out function to avoid sanity check
    Hunted.prototype.out = function() {};

    /*
     * Adds one or more elements to the hunted elements array
     * @method add
     * @param {Array|Node} elements
     * @param {Object} options
     * @returns undefined
     */
    var add = function(elements, options) {
        // sanity check of arguments
        if (elements instanceof Node === false
                && typeof elements.length !== 'number'
                || typeof options !== 'object') {
            throw new TypeError('You must pass an element or a collection of them and an options object');
        }

        // treat single node as array
        if (elements instanceof Node === true) {
            elements = [ elements ];
        }

        var i = 0,
            len = elements.length;

        // add elements to general hunted array
        for (; i < len; i++) {
            huntedElements.push(new Hunted(elements[i], options));
        }

        // check if some of the recently added elements is already visible
        huntElements();

        i = len = null;
    };

    /*
     * Updates viewport metrics
     * @method updateMetrics
     * @returns undefined
     */
    var updateMetrics = function() {
        viewport = window.innerHeight;
    };

    /*
     * Checks if hunted elements are visible
     * @method updateMetrics
     * @returns undefined
     */
    var huntElements = function() {
        var len = huntedElements.length,
            rect,
            hunted;

        if (len > 0) {

            while (len) {
                --len;

                hunted = huntedElements[len];

                rect = hunted.element.getBoundingClientRect();

                /*
                 * trigger (in) event if element comes from a non visible state and the scrolled viewport has
                 * reached the visible range of the element without exceeding it
                 */
                if (!hunted.visible
                        && rect.top - hunted.offset < viewport
                        && rect.top >= -(rect.height + hunted.offset)) {
                    hunted.in.apply(hunted.element);
                    hunted.visible = true;
                }

                /*
                 * trigger (out) event if element comes from a visible state and it's out of the visible
                 * range its bottom or top limit
                 */
                if (hunted.visible
                        && (rect.top - hunted.offset > viewport
                        || rect.top < -(rect.height + hunted.offset))) {
                    hunted.out.apply(hunted.element);
                    hunted.visible = false;

                    // when hunting should not persist kick element out
                    if (!hunted.persist) {
                       huntedElements.splice(len, 1);
                    }
                }
            }
        }

        hunted = len = null;
    };

    /*
     * Delays hunting until scroll has finished
     * @method debounceHunt
     * @returns undefined
     */
    var debounceHunt = function() {
        if (Date.now() - time >= delay) {
            huntElements();
            cAF(frame);
            return;
        }

        frame = rAF(debounceHunt);
    };

    // on resize update viewport metrics
    window.addEventListener('resize', updateMetrics);

    // on scroll check for elements position and trigger methods
    window.addEventListener('scroll', function() {
        cAF(frame);

        time = Date.now();

        frame = rAF(debounceHunt);
    });

    return add;
});
