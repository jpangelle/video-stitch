import React, { Component } from 'react';
import {
  Button,
  Icon,
  Modal,
  Table,
} from 'antd';
import AppContext from '../../utils/context';
import './Services.css';

/* eslint-disable react/prop-types */
/* eslint-disable no-param-reassign */
/* eslint-disable react/no-did-update-set-state */
/* eslint-disable class-methods-use-this */
class Services extends Component {
  constructor() {
    super();
    this.state = {
      deleteAllModalVisible: false,
      deleteAllLoading: false,
      deleteModalVisible: false,
      pauseAllLoading: false,
      processes: [],
      startAllLoading: false,
    };
  }

  componentDidUpdate(prevProps) {
    const { context } = this.props;
    if (prevProps.context !== context) {
      if (context.processes.length) {
        context.processes.forEach((item) => {
          const {
            directoryOutput,
            directoryWatch,
            id,
            introVideoPath,
            outroVideoPath,
          } = item;
          item.directoryOutput = `/${this.popName(directoryOutput)}`;
          item.directoryWatch = `/${this.popName(directoryWatch)}`;
          item.introVideoPath = this.popName(introVideoPath);
          item.key = id;
          item.outroVideoPath = outroVideoPath ? this.popName(outroVideoPath) : 'None';
        });
      }
      this.setState({
        processes: context.processes,
      });
    }
  }

  handleCancel() {
    this.setState({
      deleteAllModalVisible: false,
      deleteModalVisible: false,
    });
  }

  async handleConfirmDeleteAll() {
    const { context } = this.props;
    const { deleteAllProcesses, handleNotifications } = context;
    this.setState({
      deleteAllModalVisible: false,
    });
    await this.setState({
      deleteAllLoading: true,
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.setState({
      deleteAllLoading: false,
    });
    deleteAllProcesses();
    handleNotifications().displaySuccess('delete');
  }

  handleConfirmDelete(processes) {
    const { context } = this.props;
    const { deleteProcesses, handleNotifications } = context;
    deleteProcesses(processes);
    this.setState({
      deleteModalVisible: false,
      processToDelete: '',
    });
    handleNotifications().displaySuccess('delete');
  }

  async handleManageButton(type) {
    const { context } = this.props;
    const { startAllProcesses, stopAllProcesses } = context;
    if (type === 'start-all') {
      await this.setState({
        startAllLoading: true,
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.setState({
        startAllLoading: false,
      });
      startAllProcesses();
    } else if (type === 'pause-all') {
      await this.setState({
        pauseAllLoading: true,
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.setState({
        pauseAllLoading: false,
      });
      stopAllProcesses();
    } else {
      this.showDeleteAllModal();
    }
  }

  popName(filepath) {
    const transformedFilepath = filepath.replace(/\\/g, '/');
    return `${transformedFilepath.split('/').pop()}`;
  }

  showDeleteAllModal() {
    this.setState({
      deleteAllModalVisible: true,
    });
  }

  showDeleteModal(processToDelete) {
    this.setState({
      processToDelete,
      deleteModalVisible: true,
    });
  }

  render() {
    const { context } = this.props;
    const {
      startProcesses,
      stopProcesses,
    } = context;
    const {
      deleteAllModalVisible,
      deleteAllLoading,
      deleteModalVisible,
      pauseAllLoading,
      processes,
      processToDelete,
      startAllLoading,
    } = this.state;
    const columns = [{
      title: 'Name',
      dataIndex: 'fileName',
      width: 200,
    }, {
      title: 'Intro Video',
      dataIndex: 'introVideoPath',
      width: 200,
    }, {
      title: 'Outro Video',
      dataIndex: 'outroVideoPath',
      width: 200,
    }, {
      title: 'Folder To Watch',
      dataIndex: 'directoryWatch',
      width: 200,
    }, {
      title: 'Folder To Output',
      dataIndex: 'directoryOutput',
      width: 200,
    }, {
      title: 'Toggle',
      render: (data) => {
        const { id, status } = data;
        if (status) {
          return (
            <Icon type="pause" className="status-button" theme="outlined" onClick={() => stopProcesses(id)} />
          );
        }
        return (
          <Icon type="caret-right" className="status-button" theme="outlined" onClick={() => startProcesses(id)} />
        );
      },
      width: 100,
    }, {
      dataIndex: 'id',
      render: data => (
        <Icon className="delete-icon delete-process" type="close" onClick={() => this.showDeleteModal(data)} theme="outlined" />
      ),
      width: 90,
    }];

    return (
      <div className="services">
        <h1 className="component-header">Services</h1>
        {processes.length
          ? (
            <React.Fragment>
              <div className="manage-buttons">
                <Button
                  disabled={!processes.length}
                  loading={startAllLoading}
                  onClick={() => this.handleManageButton('start-all')}
                >
                  Start All
                </Button>
                <Button
                  disabled={!processes.length}
                  loading={pauseAllLoading}
                  onClick={() => this.handleManageButton('pause-all')}
                >
                  Pause All
                </Button>
                <Button
                  disabled={!processes.length}
                  loading={deleteAllLoading}
                  type="danger"
                  onClick={() => this.showDeleteAllModal()}
                >
                  Delete All
                </Button>
              </div>
              <Table
                columns={columns}
                dataSource={processes}
              />
              <Modal
                title="Warning"
                visible={deleteAllModalVisible}
                onCancel={() => this.handleCancel()}
                footer={[
                  <Button key="back" onClick={() => this.handleCancel()}>Cancel</Button>,
                  <Button key="confirm" type="primary" onClick={() => this.handleConfirmDeleteAll()}>Yes</Button>,
                ]}
              >
                <p>
                  Are you sure you want to delete all services?
                </p>
              </Modal>
              <Modal
                title="Warning"
                visible={deleteModalVisible}
                onCancel={() => this.handleCancel()}
                footer={[
                  <Button key="back" onClick={() => this.handleCancel()}>Cancel</Button>,
                  <Button key="confirm" type="primary" onClick={() => this.handleConfirmDelete(processToDelete)}>Yes</Button>,
                ]}
              >
                <p>
                  Are you sure you want to delete this service?
                </p>
              </Modal>
            </React.Fragment>
          )
          : (
            <div className="empty-state">
              <Icon type="file-search" theme="outlined" />
              <p>It looks like no services have been created. Create a service above!</p>
            </div>
          )
        }
      </div>
    );
  }
}

export default props => (
  <AppContext.Consumer>
    {context => <Services {...props} context={context} />}
  </AppContext.Consumer>
);
