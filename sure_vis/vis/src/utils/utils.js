
export const apidomain = "http://127.0.0.1:1127/";

export function doFetch(url, cb) {
    fetch(`${window.PUBLIC_URL}${url}`).then((data) => {
        // console.log(url)
        if(data.status !== 200 || !data.ok) {
            throw new Error(`server returned ${data.status}${data.ok ? " ok" : ""}`);
        }
        const ct = data.headers.get("content-type");
        return data.json();
        // if(ct && ct.includes("application/json")) {
        //   return data.json();
        // }
        // throw new TypeError("response not JSON encoded");
    }).then(cb);
} // doFetch

export function getParameterByKey(key) {
    const urlParams = new URLSearchParams(window.location.search);
    const myParam = urlParams.get(key);
    console.log(myParam);
    return myParam;
}

export const column_order_by_feat_freq = (attrs, rules) => {
    let col_info = [],
        col_order = [];
    for (let i = 0; i < attrs.length; i++) {
        col_info.push({
            'idx': i,
            'freq': 0
        });
        col_order.push(i);
    }

    rules.forEach((d)=> {
        let rule = d['rules']
        rule.forEach((r) => {
            col_info[r['feature']].freq++;
        });
    })

    // sort columns by freq.
    col_info.sort((a, b) => (a.freq > b.freq) ? -1 : 1);
    col_info.forEach((d, i) => col_order[d.idx] = i);

    return [col_order, col_info];
}

export const readable_text = (val) => {
    if (val>Math.floor(val) && val<Math.floor(val)+1) {
        return val.toFixed(1)
    } else {
        return val;
    }
}

export const  transform_selected_rule = (lattice, node_id) => {
    let currentRuleNodes = [];
    let nid = node_id;
    while (nid > 0) {
        let cond = {
            'feature': lattice[nid]['feature'],
            'sign': lattice[nid]['sign']
        }
        if (cond['sign'] === 'range') {
            cond['threshold0'] = lattice[nid]['threshold0'];
            cond['threshold1'] = lattice[nid]['threshold1'];
        } else {
            cond['threshold'] = lattice[nid]['threshold'];
        }

        currentRuleNodes.unshift(cond);
        nid = lattice[nid]['parent'];
    }
    return currentRuleNodes;
}

export function postData(url, data, cb) {
    var myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    if (cb !== undefined) {
        fetch(`${apidomain}${url}`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body:JSON.stringify(data)
        }).then((data) => {
            if(data.status !== 200 || !data.ok) {
                throw new Error(`server returned ${data.status}${data.ok ? " ok" : ""}`);
            }
            const ct = data.headers.get("content-type");
            return data.json();
        }).then((cb));
    } else {
        fetch(`${window.PUBLIC_URL}${url}`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body:JSON.stringify(data)
        }).then((res) => {
            console.log(res);
        });
    }

}
