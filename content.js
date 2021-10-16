function buildZeroTree(parent, data, depth) {
    return {
        parent: parent,
        data: data,
        end: false,
        children: {},
        link: null,
        depth: depth
    }
}


function buildTrie(wordList) {
    const Root = buildZeroTree(null, null, 0);
    Root.parent = Root;

    for (const words of wordList) {
        let v = Root;
        for (const char of words) {
            const c = char;
            if (!v.children[c]) {
                v.children[c] = buildZeroTree(v, c, v.depth + 1);
            }
            v = v.children[c];
        }
        v.end = true;
    }
    return Root;
}


function GetSuffixLink(v, Root) {
    if (v.link === null) {
        if ((v === Root) || (v.parent === Root)) {
            v.link = Root;
        } else {
            v.link = GetTransition(GetSuffixLink(v.parent, Root), v.data, Root);
        }
    }
    return v.link;
}

function GetTransition(v, c, Root) {
    if (!v.children[c]) {
        if (v === Root) {
            return v;
        }
        v.children[c] = GetTransition(GetSuffixLink(v, Root), c, Root);
    }
    return v.children[c];
}


function change(text, Root) {
    const begins = [];
    const lens = [];
    let S = Root;
    let k = 0;
    for (let i = 0; i < text.length; i++) {
        S = GetTransition(S, text[i].toLocaleLowerCase(), Root);
        if (S.end === true) {
            begins.push(i - S.depth + 1);
            lens.push(S.depth);
            while (begins.length > 1 && begins[begins.length-1] === begins[begins.length-2]){
                begins.pop();
                lens[lens.length-2] = lens[lens.length-1];
                lens.pop();
            }
            k++;
        }
    }
    let t = 0;
    let text_new = '';
    for (let i = 0; i < text.length; i++) {
        if (begins[t] === i) {
            text_new = text_new + "*".repeat(lens[t]);
            i = i + lens[t] - 1;
            t++;
        } else text_new = text_new + text[i];
    }
    return text_new;
}


//* считали плохие слова

const badWordsUrl = chrome.runtime.getURL('badwords.txt');
fetch(badWordsUrl)
    .then(response => response.arrayBuffer())
    .then(buffer => {
        const wordList = new TextDecoder('utf-8').decode(buffer).split(',');
        for (let i = 0; i < wordList.length; i++) {
            wordList[i] = wordList[i].trim().toLocaleLowerCase();
        }
        const Root = buildTrie(wordList);

        const elements = document.getElementsByTagName('*');
        for (const element of elements) {
            for (const node of element.childNodes) {
                if (node.nodeType === 3) {
                    const text = node.nodeValue;
                    const new_text = change(text, Root);
                    if (new_text !== text) {
                        element.replaceChild(document.createTextNode(new_text), node);
                    }
                }
            }
        }
    })

