import os

try:
    import importlib.resources as pkg_resources
except ImportError:
    # Try backported to PY<37 `importlib_resources`.
    import importlib_resources as pkg_resources

from copyreg import constructor
from gc import callbacks
from notebookjs import execute_js
import numpy as np
import pandas as pd

from .surrogate_rule import forest_info
from .surrogate_rule import tree_node_info

default_rule_paras = {
            "support": 5,
            "fidelity": .85,
            "num_feat": 4,
            "num_bin": 3,
        }

default_error_rule_paras = {
           "support": 5,
           "fidelity": .35,
           "num_feat": 4,
           "num_bin": 3,
       }

class SuRE:
    def __init__(self, data, rule_paras=None, error_class= None, error_analysis=False) -> None:
        ## user-generated data
        self.data = data
        if (rule_paras):
            self.rule_paras = rule_paras
        else:
            self.rule_paras = default_rule_paras
        self.error_class = error_class

        self.error_analysis = error_analysis

        ## loading rules
        self.generate_rules()

        ## loading vis lib
        self.vislib = None
        data_dir = os.path.join(os.path.dirname(__file__), "")
        data_path = os.path.join(data_dir, "vis/dist/sure.js")
        with open(data_path, "r") as f:
            self.vislib = f.read()

    def generate_rules(self):
        data = self.data
        rule_paras = self.rule_paras

        attrs = data['columns']

        surrogate_obj = tree_node_info.tree_node_info()
        y_pred = data['y_pred']
        y_gt = data['y_gt']
        df = pd.DataFrame(data=np.array(data['data']), columns = attrs)

        surrogate_obj.initialize(X=np.array(data['data']), y=np.array(data['y_gt']),
                                 y_pred=np.array(data['y_pred']), debug_class=-1,
                                 attrs=data['columns'], filter_threshold=rule_paras,
                                 n_cls=len(data['target_names']),
                                 num_bin=rule_paras['num_bin'],
                                 error_analysis = self.error_analysis,
                                 verbose=False
        ).train_surrogate_random_forest().tree_pruning()

        forest_obj = tree_node_info.forest()
        forest_obj.initialize(
            trees=surrogate_obj.tree_list, cate_X=surrogate_obj.cate_X,
            y=surrogate_obj.y, y_pred=surrogate_obj.y_pred, attrs=attrs,
            num_bin=rule_paras['num_bin'],
            real_percentiles=surrogate_obj.real_percentiles,
            real_min=surrogate_obj.real_min, real_max=surrogate_obj.real_max,
        ).construct_tree().extract_rules()

        forest = forest_info.Forest()

        forest.initialize(forest_obj.tree_node_dict, data['real_min'], data['real_max'],
                          surrogate_obj.percentile_info,
                          df, data['y_pred'], data['y_gt'],
                          forest_obj.rule_lists,
                          data['target_names'],
                          error_analysis = self.error_analysis,
                         )
        forest.initialize_rule_match_table()
        forest.initilized_rule_overlapping()

        res = forest.find_the_min_set()
        lattice = forest.get_lattice_structure(res['rules'])

        res['lattice'] = lattice
        res['lattice_preIndex'] = forest.preIndex
        res['filter_threshold'] = rule_paras

        self.rule_result = res

    def visualize(self):
        ## setting callbacks
        callbacks = {
            'explore_rule': self.explore_rule,
        }

        ## setting input data
        input_data = {key: self.rule_result[key] for key in self.rule_result.keys()}
        input_data['error_analysis'] = self.error_analysis
        for key in self.data:
            input_data[key] = self.data[key]

        # Plotting the Visualization
        execute_js(
            library_list=[self.vislib],
            main_function="sure.renderSuRE",
            data_dict=input_data,
            callbacks=callbacks )


    def explore_rule(self, rule):
        df = pd.DataFrame(data=self.data['data'], columns=self.data['columns'])
        df['y_gt'] = self.data['y_gt']
        df['y_pred'] = self.data['y_pred']

        ## initialize
        res = []

        # update lattice node info
        cols = df.columns

        for cond in rule:
            # compare values with condition
            col = cols[cond['feature']]
            if (cond['sign'] == 'range'):
                df = df[(df[col] >= cond['threshold0']) & (df[col] < cond['threshold1'])]
            elif (cond['sign'] == '<'):
                df = df[df[col] < cond['threshold']]
            elif (cond['sign'] == '>'):
                df = df[df[col] > cond['threshold']]
            elif (cond['sign'] == '<='):
                df = df[df[col] <= cond['threshold']]
            elif (cond['sign'] == '>='):
                df = df[df[col] >= cond['threshold']]
            else:
                print("!!!!!! Error rule !!!!!!")

            res.append(self.update_cond_stat(df, cond))
        return res


    def update_cond_stat(self, matched_data, cond):
        n_cls = len(self.data['target_names'])
        conf_matrix = np.zeros(shape=(n_cls,2))
        for i in range(n_cls):
            conf_matrix[i][0] = ((matched_data['y_pred'] == i) & (matched_data['y_pred']!=matched_data['y_gt'])).sum()
            conf_matrix[i][1] = ((matched_data['y_pred'] == i) & (matched_data['y_pred']==matched_data['y_gt'])).sum()
        return {
            'condition': cond,
            'support': matched_data.shape[0],
            'conf_matrix': conf_matrix.tolist()
        }

