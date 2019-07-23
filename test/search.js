/*global describe it create_doc autosubmit insert_doc autocomplete delete_doc create_word search search_word doc2words freq2matches*/
const
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    code = String(fs.readFileSync(path.join(__dirname, '..', 'src', 'search.js'), 'utf8'))

// worker file has importScripts and it does not support module.exports / export
// eslint-disable-next-line
eval(code)

describe('search request "cat b" should autocomplete "b" -> "b"ug & "b"ugzilla and search "cat bug bugzilla" -> [1, 2]', () => {
    const
        trie = [
            create_doc('bug'     , 'cat' , 1),
            create_doc('bugzilla', 'cat' , 2)
        ].reduce(insert_doc, {})

    it('cat b -> [1, 2]', () =>
        assert.deepEqual(
            autosubmit(trie, 'cat b'),
            [1, 2]))
})

describe('autosubmit - should autocomplete last word and search by each word then reduce results by priority', () => {
    const
        trie = [
            create_doc('one'  , 'ok' , 1),
            create_doc('two'  , 'ok' , 2),
            create_doc('three', 'ok' , 3),
            create_doc('four' , 'ok' , 4)
        ].reduce(insert_doc, {})

    it('one tw -> [1, 2]', () =>
        assert.deepEqual(
            autosubmit(trie, 'one tw'),//"one tw" -> "one two" -> [1, 2]
            [1, 2]))
    it('one four tw -> [1, 2, 4]', () =>
        assert.deepEqual(
            autosubmit(trie, 'one four tw'),//"one tw" -> "one two" -> [1, 2]
            [1, 2, 4]))
    it('one f -> [1, 4]', () =>
        assert.deepEqual(
            autosubmit(trie, 'one f'),//"one f" -> "one four" -> [1, 4]
            [1, 4]))
    it('ok -> [1, 2, 3, 4]', () =>
        assert.deepEqual(
            autosubmit(trie, 'ok'),//"ok" -> "ok" -> [1, 2, 3, 4]
            [1, 2, 3, 4]))
})

describe('autocomplete (diff words length)', () => {
    const
        tree = [
            create_doc('dog', 'car carrot' , 1)
        ].reduce(insert_doc, {})

    it('c -> car carrot', () =>
        assert.deepEqual(
            autocomplete(tree, 'c', 20),
            ['car', 'carrot']))
    it('ca -> car carrot', () =>
        assert.deepEqual(
            autocomplete(tree, 'ca', 20),
            ['car', 'carrot']))
    it('car -> car carrot', () =>
        assert.deepEqual(
            autocomplete(tree, 'car', 20),
            ['car', 'carrot']))
    it('carr -> carrot', () =>
        assert.deepEqual(
            autocomplete(tree, 'carr', 20),
            ['carrot']))
})

describe('autocomplete', () => {
    const
        tree = [
            create_doc('cap', 'cat cut' , 1)
        ].reduce(insert_doc, {})

    it('c -> cap cat cut', () =>
        assert.deepEqual(
            autocomplete(tree, 'c', 20),
            ['cap', 'cat', 'cut']))

    it('ca -> cap cat', () =>
        assert.deepEqual(
            autocomplete(tree, 'ca', 20),
            ['cap', 'cat']))

    it('cu -> cut', () =>
        assert.deepEqual(
            autocomplete(tree, 'cu', 20),
            ['cut']))

    it('cut -> cut', () =>
        assert.deepEqual(
            autocomplete(tree, 'cut', 20),
            ['cut']))

    it('cat -> cat', () =>
        assert.deepEqual(
            autocomplete(tree, 'cat', 20),
            ['cat']))

    it('cap -> cap', () =>
        assert.deepEqual(
            autocomplete(tree, 'cap', 20),
            ['cap']))
})

describe('search', () => {

    it('"doc2" should be at first result because it has two words from search request', () => {
        const
            tree = [
                create_doc('doc1', 'cat'    , 1),
                create_doc('doc2', 'cat dog', 2),
                create_doc('doc3', 'cat'    , 3),
                create_doc('doc5', 'dog'    , 5),
                create_doc('doc7', 'dog'    , 7)
            ].reduce(insert_doc, {})
        assert.equal(
            search(tree, 'cat dog')[0],
            2
        )
    })

    it('order should be ', () => {
        const
            tree = [
                create_doc('cat dog'     , 'cat dog dog' , 1),
                create_doc('fish'        , 'cat fish dog', 2),
                create_doc('dog'         , 'cat'         , 3),
                create_doc('cat'         , 'cat cat'     , 4),
                create_doc('cat dog fish', 'dog'         , 5)
            ].reduce(insert_doc, {})
        assert.deepEqual(
            search(tree, 'cat dog fish'),
            ['5', '1', '2', '4', '3']
        )
    })

    it('lev_tolstoy (this test fit in 2 sec)', function () {
        const
            roman = String(require('fs').readFileSync(require('path').join(__dirname, 'lev_tolstoy.txt'), 'utf8')),
            tree = insert_doc({}, create_doc('Война и мир', roman, 1)),
            mb = Buffer.from(JSON.stringify(tree)).length / (1024 * 1024)
        assert.equal(
            search_word(tree, create_word('прусский', {}))[0].desc,
            14
        )
        assert.ok(mb < 15, 'less then 15 Mb')
    })
})

describe('doc2words', () => {

    it('should not same words in words', () => {
        const
            words = doc2words(
                create_doc('cat dog', 'cat fish', 1)
            )

        assert.deepEqual(
            words,
            [
                { letters: [ 'c', 'a', 't' ],      $: {title: 1, desc: 1}},
                { letters: [ 'd', 'o', 'g' ],      $: {title: 1         }},
                { letters: [ 'f', 'i', 's', 'h' ], $: {          desc: 1}}
            ]
        )
    })

    it('should not same words in words', () =>
        assert.deepEqual(
            doc2words(create_doc('cat cat cat', 'cat cat', 1)),
            [
                { letters: [ 'c', 'a', 't' ],      $: {title: 3, desc: 2}}
            ]
        ))
})

describe('freq2matches (docs with word mentioned in title should be show at first when docs matched by desc)', () => {

    describe('sorting by title has priority', () => {

        it('desc same', () =>
            assert.deepEqual(
                freq2matches(
                    {
                        doc1: {title: 3, desc: 1},
                        doc2: {title: 1, desc: 1},
                        doc3: {title: 2, desc: 1}
                    }
                ),
                [
                    { title: 3, desc: 1, id: 'doc1' },
                    { title: 2, desc: 1, id: 'doc3' },
                    { title: 1, desc: 1, id: 'doc2' }
                ]))

        it('desc diff', () =>
            assert.deepEqual(
                freq2matches(
                    {
                        doc1: {title: 3, desc: 1},
                        doc2: {title: 1, desc: 1},
                        doc3: {title: 2, desc: 9}
                }
            ),
            [
                { title: 3, desc: 1, id: 'doc1' },
                { title: 2, desc: 9, id: 'doc3' },
                { title: 1, desc: 1, id: 'doc2' }
            ]))
    })

    describe('title same - sort by priority', () => {

        it('desc diff', () =>
            assert.deepEqual(
                freq2matches(
                    {
                        doc1: {title: 1, desc: 3},
                        doc2: {title: 1, desc: 1},
                        doc3: {title: 1, desc: 2}
                    }
                ),
                [
                    { title: 1, desc: 3, id: 'doc1' },
                    { title: 1, desc: 2, id: 'doc3' },
                    { title: 1, desc: 1, id: 'doc2' }
                ]))

        it('desc diff and same', () =>
            assert.deepEqual(
                freq2matches({
                    doc1: {title: 1, desc: 3},
                    doc2: {title: 1, desc: 1},
                    doc3: {title: 1, desc: 1}
                }),
                [
                    { title: 1, desc: 3, id: 'doc1' },
                    { title: 1, desc: 1, id: 'doc2' },
                    { title: 1, desc: 1, id: 'doc3' }
                ]
            )
        )
    })

    describe('sort by title & priority', () => {

        it('title & desc diff', () =>
            assert.deepEqual(
                freq2matches(
                    {
                        doc1: {title: 3, desc: 1},
                        doc2: {title: 3, desc: 2},
                        doc3: {title: 2, desc: 1},
                        doc4: {title: 2, desc: 2},
                        doc5: {title: 1, desc: 1},
                        doc6: {title: 1, desc: 2}
                    }
                ),
                [
                    {
                        "desc": 2,
                        "id": "doc2",
                        "title": 3
                    },
                    {
                        "desc": 1,
                        "id": "doc1",
                        "title": 3
                    },
                    {
                        "desc": 2,
                        "id": "doc4",
                        "title": 2
                    },
                    {
                        "desc": 1,
                        "id": "doc3",
                        "title": 2
                    },
                    {
                        "desc": 2,
                        "id": "doc6",
                        "title": 1
                    },
                    {
                        "desc": 1,
                        "id": "doc5",
                        "title": 1
                    }
                ]
            )
        )
    })

})

describe('create_word', () => {
    const
        word = create_word('cat', {title: 1, desc: 2})

    it('should return object with keys "letters", "$"', () =>
        assert.ok([
            'letters',
            '$'
        ].reduce((ok, key) => ok && word.hasOwnProperty(key))))

    it('letters is collection chars form word', () =>
        assert.deepEqual(word.letters, ['c', 'a', 't']))
})

describe('insert_doc', () => {

    it('should add only one word', () => {
        const
            tree = {},
            doc = create_doc('cat', 'cat cat', 1)
        insert_doc(tree, doc)
        assert.deepEqual(
            tree,
            {
                "c": {
                    "$": {
                        "title": 1,
                        "desc": 2
                    },
                    "a": {
                        "$": {
                            "title": 1,
                            "desc": 2
                        },
                        "t": {
                            "$": {
                                "title": 1,
                                "desc": 2
                            },
                            "docs": {
                                "freq": {
                                    "1": {
                                        "title": 1,
                                        "id": "1",
                                        "desc": 2
                                    }
                                },
                                "matches": [
                                    {
                                        "title": 1,
                                        "id": "1",
                                        "desc": 2
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        )
    })

    it('should add 2 words from 1 doc', () => {
        const
            tree = {},
            doc = create_doc('cat', 'cat cat cap', 1)
        insert_doc(tree, doc)
        assert.deepEqual(
            tree,
            {
                "c": {
                    "$": {
                        "title": 1,
                        "desc": 3
                    },
                    "a": {
                        "$": {
                            "title": 1,
                            "desc": 3
                        },
                        "t": {
                            "$": {
                                "title": 1,
                                "desc": 2
                            },
                            "docs": {
                                "freq": {
                                    "1": {
                                        "title": 1,
                                        "id": "1",
                                        "desc": 2
                                    }
                                },
                                "matches": [
                                    {
                                        "title": 1,
                                        "id": "1",
                                        "desc": 2
                                    }
                                ]
                            }
                        },
                        "p": {
                            "$": {
                                "desc": 1
                            },
                            "docs": {
                                "freq": {
                                    "1": {
                                        "title": 0,
                                        "id": "1",
                                        "desc": 1
                                    }
                                },
                                "matches": [
                                    {
                                        "title": 0,
                                        "id": "1",
                                        "desc": 1
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        )
    })

    it('should add 2 words from 2 doc', () => {
        const
            tree = {},
            doc1 = create_doc('cat', 'cat cat', 1),
            doc2 = create_doc('cap', 'cap cap', 2)
        insert_doc(tree, doc1)
        insert_doc(tree, doc2)
        assert.deepEqual(
            tree,
            {
                "c": {
                    "$": {
                        "title": 2,
                        "desc": 4
                    },
                    "a": {
                        "$": {
                            "title": 2,
                            "desc": 4
                        },
                        "t": {
                            "$": {
                                "title": 1,
                                "desc": 2
                            },
                            "docs": {
                                "freq": {
                                    "1": {
                                        "title": 1,
                                        "id": "1",
                                        "desc": 2
                                    }
                                },
                                "matches": [
                                    {
                                        "title": 1,
                                        "id": "1",
                                        "desc": 2
                                    }
                                ]
                            }
                        },
                        "p": {
                            "$": {
                                "title": 1,
                                "desc": 2
                            },
                            "docs": {
                                "freq": {
                                    "2": {
                                        "title": 1,
                                        "id": "2",
                                        "desc": 2
                                    }
                                },
                                "matches": [
                                    {
                                        "title": 1,
                                        "id": "2",
                                        "desc": 2
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        )
    })

    it('should add 2 words from 2 doc (both words in both docs)', () => {
        const
            tree = {},
            doc1 = create_doc('cat', 'cap cap', 1),
            doc2 = create_doc('cap', 'cat cat', 2)
        insert_doc(tree, doc1)
        insert_doc(tree, doc2)
        assert.deepEqual(
            tree,
            {
                "c": {
                    "$": {
                        "title": 2,
                        "desc": 4
                    },
                    "a": {
                        "$": {
                            "title": 2,
                            "desc": 4
                        },
                        "t": {
                            "$": {
                                "title": 1,
                                "desc": 2
                            },
                            "docs": {
                                "freq": {
                                    "1": {
                                        "title": 1,
                                        "id": "1",
                                        "desc": 0
                                    },
                                    "2": {
                                        "title": 0,
                                        "id": "2",
                                        "desc": 2
                                    }
                                },
                                "matches": [
                                    {
                                        "title": 1,
                                        "id": "1",
                                        "desc": 0
                                    },
                                    {
                                        "title": 0,
                                        "id": "2",
                                        "desc": 2
                                    }
                                ]
                            }
                        },
                        "p": {
                            "$": {
                                "desc": 2,
                                "title": 1
                            },
                            "docs": {
                                "freq": {
                                    "1": {
                                        "title": 0,
                                        "id": "1",
                                        "desc": 2
                                    },
                                    "2": {
                                        "title": 1,
                                        "id": "2",
                                        "desc": 0
                                    }
                                },
                                "matches": [
                                    {
                                        "title": 1,
                                        "id": "2",
                                        "desc": 0
                                    },
                                    {
                                        "title": 0,
                                        "id": "1",
                                        "desc": 2
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        )
    })

})

describe('insert/delete', () => {

    it('should return same tree +1 -1 = 0', () => {
        const
            tree = {},
            doc = create_doc('cat', 'cat cat', 1)
        insert_doc(tree, doc)
        delete_doc(tree, doc)
        assert.deepEqual(tree, {})
    })

    it('insert 2 docs then delete 1 doc: should be 1 doc in tree', () => {
        const
            tree = {},
            doc1 = create_doc('cat', 'cat cat', 1),
            doc2 = create_doc('cap', 'cat', 2)
        insert_doc(tree, doc1)
        insert_doc(tree, doc2)
        delete_doc(tree, doc2)
        assert.deepEqual(
            tree,
            insert_doc({}, doc1)
        )
    })

})
