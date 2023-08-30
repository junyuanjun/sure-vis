import React, { useState } from 'react';
import {connect} from "react-redux";

const RuleSuggestion = ( props ) => {
    return <div>

    </div>;
}

function mapStateToProps(state) {
    return {
        rule_suggestions: state.rule_suggestions
    };
}

export default connect(mapStateToProps)(RuleSuggestion);