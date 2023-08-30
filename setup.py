from setuptools import setup, find_packages

with open("README.md", "r") as fh:
    long_description = fh.read()

setup(
    name="sure_vis",
    version="0.0.1",
    author="Jun Yuan, Brian Barr, Kyle Overton, Enrico Bertini",
    author_email="junyuan@nyu.edu",
    description="sure_vis. A tool to generate and visualize interpretable surrogate rules for classification models in Jupyter Notebooks",
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/junyuanjun/sure_vis',
    packages=find_packages(exclude=['node_modules']),
    include_package_data=True,
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: BSD License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.7',
    install_requires=[
        'numpy',
        'scikit-learn',
        'notebook',
        'notebookjs',
        'pandas',
        'scipy',
        'importlib_resources'
    ]
)