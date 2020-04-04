import React, { Component } from 'react';
import { Button, Checkbox, Input } from 'antd';
import AppContext from '../../utils/context';
import './CreateService.css';

const { ipcRenderer } = window.require('electron');

class CreateService extends Component {
  constructor() {
    super();
    this.state = {
      autoStartService: false,
      isDirty: false,
      isValid: false,
    };
  }

  clearFields() {
    this.setState({
      autoStartService: false,
      directoryOutput: undefined,
      directoryWatch: undefined,
      fileName: '',
      introVideoPath: undefined,
      outroVideoPath: undefined,
    }, () => {
      this.validateForm();
    });
  }

  /* eslint-disable class-methods-use-this */
  /* eslint-disable react/prop-types */
  directoryWatchSelect() {
    ipcRenderer.send('directoryWatchSelect');
    ipcRenderer.once('directoryWatchSelect', (event, directories) => {
      if (!directories) return;
      this.setState({
        directoryWatch: directories[0],
      }, () => {
        this.validateForm();
      });
    });
  }

  directoryOutputSelect() {
    ipcRenderer.send('directoryOutputSelect');
    ipcRenderer.once('directoryOutputReceived', (event, directories) => {
      if (!directories) return;
      this.setState({
        directoryOutput: directories[0],
      }, () => {
        this.validateForm();
      });
    });
  }

  handleCheckbox() {
    const { autoStartService } = this.state;
    this.setState({
      autoStartService: !autoStartService,
    });
  }

  handleKeyPress(e, processData) {
    const { context } = this.props;
    const { createProcess } = context;
    const { isValid } = this.state;
    if (e.key === 'Enter' && isValid) {
      createProcess(processData);
      this.clearFields();
    }
  }

  handleInput(e) {
    const { value } = e.target;
    this.setState({
      fileName: value,
    }, () => {
      this.validateForm();
    });
  }

  mp4Select(videoType) {
    ipcRenderer.send('mp4Select');
    ipcRenderer.once('fileReceived', (event, files) => {
      if (files) {
        if (videoType === 'intro') {
          this.setState({
            introVideoPath: files[0],
          }, () => {
            this.validateForm();
          });
        } else {
          this.setState({
            outroVideoPath: files[0],
          }, () => {
            this.validateForm();
          });
        }
      }
    });
  }

  popName(filepath) {
    const transformedFilepath = filepath.replace(/\\/g, '/');
    return `${transformedFilepath.split('/').pop()}`;
  }

  validateInput(input) {
    if (!input) {
      return false;
    }
    const validFileNameRegex = /^[0-9a-zA-Z^&'@{}[\],$=!-#().%+~_ ]{1,100}$/;
    return validFileNameRegex.test(input);
  }

  validateForm() {
    const {
      directoryOutput,
      directoryWatch,
      fileName,
      introVideoPath,
      outroVideoPath,
    } = this.state;

    if (
      directoryOutput
      && directoryWatch
      && introVideoPath
      && this.validateInput(fileName)
      && directoryOutput !== directoryWatch
    ) {
      this.setState({
        isValid: true,
      });
    } else {
      this.setState({
        isValid: false,
      });
    }

    if (
      directoryOutput
      || directoryWatch
      || introVideoPath
      || outroVideoPath
      || this.validateInput(fileName)
    ) {
      this.setState({
        isDirty: true,
      });
    } else {
      this.setState({
        isDirty: false,
      });
    }
  }

  render() {
    const { context } = this.props;
    const { createProcess } = context;
    const {
      autoStartService,
      directoryOutput,
      directoryWatch,
      fileName,
      introVideoPath,
      isDirty,
      isValid,
      outroVideoPath,
    } = this.state;
    const processData = {
      autoStartService,
      directoryOutput,
      directoryWatch,
      fileName,
      introVideoPath,
      outroVideoPath,
    };

    return (
      <div className="create-service">
        <h1 className="component-header create-new-service-label">Create New Service</h1>
        <div className="file-pickers">
          <div className="intro">
            <Button onClick={() => this.mp4Select('intro')}>
              Choose Intro Video
            </Button>
            <div className="path">
              <p className="path-selected">
                <span className="path-label">Selected: </span>
                {introVideoPath ? this.popName(introVideoPath) : 'None'}
              </p>
            </div>
          </div>
          <div className="outro">
            <Button onClick={() => this.mp4Select('outro')}>
              Choose Outro Video
            </Button>
            <div className="path">
              <p className="path-selected">
                <span className="path-label">Selected: </span>
                {outroVideoPath ? this.popName(outroVideoPath) : 'None'}
              </p>
            </div>
          </div>
          <div className="watch">
            <Button onClick={() => this.directoryWatchSelect()}>
              Choose Folder To Watch
            </Button>
            <div className="path">
              <p className="path-selected">
                <span className="path-label">Selected: </span>
                {directoryWatch ? `/${this.popName(directoryWatch)}` : 'None'}
              </p>
            </div>
          </div>
          <div className="output">
            <Button onClick={() => this.directoryOutputSelect()}>
              Choose Folder To Output
            </Button>
            <div className="path">
              <p className="path-selected">
                <span className="path-label">Selected: </span>
                {directoryOutput ? `/${this.popName(directoryOutput)}` : 'None'}
              </p>
            </div>
          </div>
        </div>
        <div className="filename">
          <span className="filename-label">Desired Filename:</span>
          <Input id="fileName" addonAfter=".mp4" value={fileName} onChange={e => this.handleInput(e)} onKeyPress={e => this.handleKeyPress(e, processData)} />
        </div>
        <div className="auto-start-checkbox">
          <Checkbox
            checked={autoStartService}
            onChange={() => this.handleCheckbox()}
          >
            Start Service Upon Creation
          </Checkbox>
        </div>
        <div className="clear-start">
          <div className="clear">
            <Button disabled={!isDirty} size="large" onClick={() => this.clearFields()}>
              Clear Fields
            </Button>
          </div>
          <div className="start">
            <Button disabled={!isValid} size="large" type="primary" onClick={() => { createProcess(processData); this.clearFields(); }}>
              Create Service
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default props => (
  <AppContext.Consumer>
    {context => <CreateService {...props} context={context} />}
  </AppContext.Consumer>
);
