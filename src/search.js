function create_word (word, $) {
    return {
        letters: word.split(''),
        $
    }
}

function text2words (text) {
    return text.split(/\s+/).filter(word => word && word.length > 1)
}

function doc2words (doc) {

    var words = {}

    words = text2words(doc.title).reduce(
        (words, word) => {
            words[word] = words[word] || create_word(word, {})
            words[word].$.title =  words[word].$.title || 0
            words[word].$.title += 1
            return words
        },
        words
    )
    words = text2words(doc.desc).reduce(
        (words, word) => {
            words[word] = words[word] || create_word(word, {})
            words[word].$.desc =  words[word].$.desc || 0
            words[word].$.desc += 1
            return words
        },
        words
    )

    return Object.values(words)
}

function freq2ids (freq) {
    return Object
        .keys(freq)
        .sort((a, b) =>
            freq[a].title === freq[b].title
                ? freq[b].desc - freq[a].desc
                : freq[b].title - freq[a].title)
}

function freq2matches (freq) {
    return freq2ids(freq)
        .map(id => {
            freq[id].id = id
            return freq[id]
        })
}

function doc2node (node, doc, $) {
    // improve: best data structure for docs is max heap where key is freq word in doc
    node.docs = node.docs || {}
    var docs = node.docs
    docs.freq = docs.freq || {}
    docs.freq[doc.id] = docs.freq[doc.id] || {title: 0, desc: 0}

    if ($.title)
        docs.freq[doc.id].title += $.title

    if ($.desc)
        docs.freq[doc.id].desc += $.desc

    docs.matches = freq2matches(docs.freq)
}

function insert_word (trie, word, doc) {
    var
        {letters, $} = word,
        node

    node = letters.reduce(
        (node, letter) => {
            node[letter] = node[letter] || {$: {}}
            inc$(node[letter].$, $)
            return node[letter]
        },
        trie
    )

    doc2node(node, doc, $)

    return trie
}

function dec$ (node$, $) {
    if ($.title > 0) node$.title -= $.title
    if ($.desc  > 0) node$.desc  -= $.desc
}
function inc$ (node$, $) {
    if ($.title > 0) {
        node$.title  = node$.title || 0;
        node$.title += $.title
    }
    if ($.desc  > 0) {
        node$.desc   = node$.desc || 0
        node$.desc  += $.desc
    }
}

function is_empty$ (node$) {
    return !node$.title && !node$.desc
}

function delete_word (trie, word, doc) {
    var
        {letters, $} = word,
        letter,
        node = trie

    while (letter = letters.shift()) {
        dec$(node[letter].$, $)
        if (is_empty$(node[letter].$)) {
            delete node[letter]//Hey GC!
            return trie
        }
        node = node[letter]
    }
    delete node.docs.freq[doc.id]
    node.docs.matches = freq2matches(node.docs.freq)

    return trie
}

function insert_doc (trie, doc) {

    var words = doc2words(doc)

    return words.reduce(
        (trie, word) => insert_word(trie, word, doc),
        trie
    )
}

function delete_doc (trie, doc) {

    var words = doc2words(doc)

    return words.reduce(
        (trie, word) => delete_word(trie, word, doc),
        trie
    )
}

function create_doc (title, desc, id) {
    return Object({title, desc, id})
}

function search_word (trie, word) {
    var
        letters = word.letters,
        node = trie,
        letter

    while (letter = letters.shift()) {
        node = node[letter]
        if (node === undefined) return []
    }

    if (node === undefined || node.docs === undefined) return []//no strict match

    return node.docs.matches
}

function search_words (trie, words) {
    return freq2ids(words.reduce(
        (h, word) =>
            search_word(trie, word).reduce(
                (h, match) => {
                    var {id} = match
                    h[id] = h[id] || {title: 0, desc: 0, id}
                    inc$(h[id], match)
                    return h
                },
                h
            ),
        {}
    ))
}

function search (trie, text) {
    var words = text2words(text)
    if (words.length === 0) return []
    return search_any_count_words(trie, words)
}

function search_any_count_words (trie, words) {
    words = words.map(_ => create_word(_, {}))
    return words.length === 1
      ? search_word(trie, words.pop()).map(match => match.id)
      : search_words(trie, words)
}

function deep_words_collect (words, word, node, max) {
    var keys = Object.keys(node)
    var letters = keys.filter(_ => _ !== '$' && _ !== 'docs')
    var freq = letters.reduce(
        (freq, letter) => {
            freq[letter] = node[letter]
            return freq
        },
        {}
    )
    letters = freq2ids(freq).sort()
    var letter
    var next_words = []
    var next_word
    for (var i = 0;i < letters.length;i++) {
        letter = letters[i]
        next_word = word + letter
        if (node[letter].docs) {
            words.push(next_word)
            if (words.length >= max) return words
        }
        next_words.push(next_word)
    }
    return next_words.reduce(
        (words, word, i) => deep_words_collect(words, word, node[letters[i]], max),
        words
    )
}

function autocomplete (root, word, max) {
    var
        letters = word.split(''),
        node = root,
        letter
    while (letter = letters.shift()) {
        node = node[letter]
        if (node === undefined) return []
    }

    return deep_words_collect(node.docs ? [word] : [], word, node, max)
}

function autosubmit (trie, text) {//autocomplete last word and search by each word then reduce results by priority
  var len = text.length
  if (len === 0) return []
  var last_char = text.substring(len - 1, len)
  var words = text.split(/\s+/)
  words = words.filter(word => word !== '')
  if (last_char !== ' ') {
    if (words.length === 0) return []
    var autocompleted = autocomplete(trie, words.pop(), 20)
    if (autocompleted.length === 0 && words.length === 0) return []
    words = words.concat(autocompleted)
  }
  return search_any_count_words(trie, words)
}

function create_trie (trie) {
    return trie || {}
}

function print (node) {
    return console.log(JSON.stringify(node, null, 4))
}
