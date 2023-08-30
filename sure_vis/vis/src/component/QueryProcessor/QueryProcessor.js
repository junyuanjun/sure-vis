import React, { PureComponent } from 'react';
import { doFetch } from '../../utils/utils.js';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as actions from '../../reducer/action.js';

const FILES = [
    "rule_result.json",
    "test.json"
];

class QueryProcessor extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {};
        this.fetched_data = {
            text_rules: [],
            rules: [],
            feature_range: {}
        };
        this.unmounted = false;
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    componentDidMount() {
        this.unmounted = false;
    }

    updateFetchedData(state) {
        let keys = Object.keys(state);
        keys.forEach((keyword) => {
            this.fetched_data[keyword] = state[keyword];
        });
    }

    loadData() {
        const {loading_finished, fetch_data, data_value} = this.props;
        const file_num = FILES.length;

        let counter = 0;
        loading_finished(false);

        let data_folder = data_value;
        if (data_folder.length > 0) {
            FILES.forEach((file) => {
                let url = "/data/" + data_folder + "/" + file;
                doFetch(url, (data) => {
                    if(this.unmounted) return;
                    let keys = Object.keys(data);
                    let state = {};
                    keys.forEach((keyword) => {
                        state[keyword] = data[keyword];
                    });
                    counter++;
                    this.updateFetchedData(state);
                    if (counter === file_num) {
                        console.log("data loader finished");
                        fetch_data(this.fetched_data);
                        loading_finished(true);
                    }
                });
            });
        }
    }

    render() {
        this.loadData();
        return <div/>;
    }
}

// export default DataLoader
function mapStateToProps(state) {
    return {
        data_value: state.data_value,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(actions, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(QueryProcessor);