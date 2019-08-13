import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ListView } from 'antd-mobile';

export default class PullListView extends PureComponent {
  static defaultProps = {
    where: '',
    rowHasChanged: () => {},
    renderRow: () => {},
    onQueryNextPage: () => {},
    onQueryTotalCount: () => {},
  };

  static propTypes = {
    where: PropTypes.string,
    rowHasChanged: PropTypes.func,
    renderRow: PropTypes.func,
    onQueryNextPage: PropTypes.func,
    onQueryTotalCount: PropTypes.func,
  };

  constructor(props) {
    super(props);

    const { rowHasChanged } = props;
    const dataSource = new ListView.DataSource({
      rowHasChanged,
    });

    this.state = {
      dataSource,
      isLoading: true,
      totalCount: 0,
    };

    this.pageIndex = 0;
  }

  componentDidMount() {
    const { where } = this.props;
    this.onQuery(where);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.where !== this.props.where || nextProps.refresh !== this.props.refresh) {
      this.onQuery(nextProps.where);
    }
  }

  onQuery = where => {
    this.pageIndex = 0;
    this.queryTotalCount(where);
    this.queryNextPage(where);
  };

  // 拖动到底部执行查询
  onEndReached = () => {
    if (this.state.isLoading) {
      return;
    }

    this.setState({ isLoading: true });
    const { where } = this.props;
    this.queryNextPage(where);
  };

  // 查询包含下一页的记录
  queryNextPage = where => {
    const { onQueryNextPage } = this.props;

    this.pageIndex += 1;
    onQueryNextPage(where, this.pageIndex).then(data => {
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(data),
        isLoading: false,
      });
    });
  };

  // 查询所有记录数
  queryTotalCount = where => {
    const { onQueryTotalCount } = this.props;

    onQueryTotalCount(where).then(totalCount => {
      this.setState({
        totalCount,
      });
      if (this.lv) this.lv.scrollTo(0, 0);
    });
  };

  render() {
    return (
      <ListView
        // eslint-disable-next-line
        ref={el => (this.lv = el)}
        dataSource={this.state.dataSource}
        renderHeader={() => (
          <span>
            共{this.state.totalCount}
            条记录
          </span>
        )}
        renderFooter={() => (
          <div style={{ padding: 30, textAlign: 'center' }}>
            {this.state.isLoading ? '加载中...' : ''}
          </div>
        )}
        renderRow={this.props.renderRow}
        style={{
          height: '100%',
          overflow: 'auto',
        }}
        contentContainerStyle={{ position: 'relative' }}
        onEndReached={this.onEndReached}
        pageSize={5}
      />
    );
  }
}
