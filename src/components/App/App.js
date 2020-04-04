import React, { Component } from 'react';
import { Divider, message } from 'antd';
import './App.css';
import CreateService from '../CreateService/CreateService';
import Header from '../Header/Header';
import Services from '../Services/Services';
import AppContext from '../../utils/context';

const { ipcRenderer } = window.require('electron');

message.config({
  duration: 1,
  maxCount: 4,
});

/* eslint-disable react/no-unused-state */
/* eslint-disable class-methods-use-this */
class App extends Component {
  constructor() {
    super();
    this.state = {
      createProcess: this.createProcess.bind(this),
      deleteAllProcesses: this.deleteAllProcesses.bind(this),
      deleteProcesses: this.deleteProcesses.bind(this),
      handleNotifications: this.handleNotifications.bind(this),
      processes: [],
      startAllProcesses: this.startAllProcesses.bind(this),
      startProcesses: this.startProcesses.bind(this),
      stopAllProcesses: this.stopAllProcesses.bind(this),
      stopProcesses: this.stopProcesses.bind(this),
    };
  }

  componentDidMount() {
    this.getProcesses();
  }

  async getProcesses() {
    await ipcRenderer.send('getProcesses');
    ipcRenderer.on('getProcesses', (event, processes) => {
      if (!Array.isArray(processes)) {
        this.handleNotifications().displayError('error');
      }
      this.setState({
        processes,
      });
    });
  }

  createProcess(processData) {
    const {
      autoStartService,
      directoryOutput,
      directoryWatch,
      fileName,
      introVideoPath,
      outroVideoPath,
    } = processData;
    ipcRenderer.send('saveProcess', {
      autoStartService,
      directoryOutput,
      directoryWatch,
      fileName,
      introVideoPath,
      outroVideoPath,
    });
    ipcRenderer.once('saveProcess', (event, response) => {
      if (response === 'success') {
        this.handleNotifications().displaySuccess('create');
      } else {
        this.handleNotifications().displayError('error');
      }
    });
  }

  deleteAllProcesses() {
    const { processes } = this.state;
    const idsToDelete = processes.map(item => item.id);
    this.deleteProcesses(idsToDelete);
  }

  async deleteProcesses(processes) {
    await this.stopProcesses(processes, 'delete');
    ipcRenderer.send('deleteProcesses', processes);
    ipcRenderer.once('deleteProcesses', (event, updatedProcesses) => {
      this.setState({
        processes: updatedProcesses,
      });
    });
  }

  stopAllProcesses() {
    const { processes } = this.state;
    const idsToStop = processes.map(item => item.id);
    this.stopProcesses(idsToStop);
  }

  stopProcesses(processes, type) {
    ipcRenderer.send('stopProcesses', processes);
    ipcRenderer.once('stopProcesses', (event, response) => {
      if (type !== 'delete') {
        if (response === 'successStoppingWatch') {
          this.handleNotifications().displaySuccess('pause');
        } else {
          this.handleNotifications().displayWarning('pause');
        }
      }
    });
  }

  startAllProcesses() {
    const { processes } = this.state;
    const idsToStart = processes.map(item => item.id);
    this.startProcesses(idsToStart);
  }

  startProcesses(processes) {
    ipcRenderer.send('startProcesses', processes);
    ipcRenderer.once('startProcesses', (event, response) => {
      if (response === 'successStartingWatch') {
        this.handleNotifications().displaySuccess('start');
      } else {
        this.handleNotifications().displayWarning('start');
      }
    });
  }

  handleNotifications() {
    return {
      displayError: (errorType) => {
        if (errorType === 'error') {
          message.error('Something went wrong');
        }
      },
      displaySuccess: (successType) => {
        if (successType === 'create') {
          message.success('Service created successfully');
        } else if (successType === 'delete') {
          message.success('Services deleted successfully');
        } else if (successType === 'pause') {
          message.success('Services paused successfully');
        } else if (successType === 'start') {
          message.success('Services started successfully');
        }
      },
      displayWarning: (warningType) => {
        if (warningType === 'pause') {
          message.warning('All services are already paused');
        } else if (warningType === 'start') {
          message.warning('All services are already started');
        }
      },
    };
  }

  render() {
    return (
      <div className="App">
        <AppContext.Provider value={this.state}>
          <Header />
          <CreateService />
          <Divider className="table-divider" />
          <Services />
        </AppContext.Provider>
      </div>
    );
  }
}

export default App;
