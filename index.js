/**
 * @Author: 高素质车间工人
 * @Date: 2018/11/30
 * @lastAuthor: 高素质车间工人
 * @lastChangeDate: 2020/04/19
 * @Explain: 公共表格组件
 * @ChildComponents:
 * @lastChange: 修复refresh时可能存在的外送、筛选参数丢失问题
 *              修复筛选参数清除时请求接口筛选参数未清除问题
 *              修复表格重绘时全局参数重置问题
 */
import React, { Component } from 'react';
import { Table, message, Tooltip } from 'antd';
import PropTypes from 'prop-types';
import './index.less'
import api from './network'

let { log, error } = console;
let page = 'page'; // 页码变量
let pageSize = 'pageSize'; // 页条数
let totalCount = 'totalCount'; // 总条数
let unselectPar = undefined; // 不可选判断字段
let list = 'list'; // 列表
let _method = 'post'; // 请求方式

// 公共方法
// 设置请求体
function setMethod(params) {
  let _this = params;
  // 请求方式
  try {
    if (_this.method === 'post' || _this.method === 'get') {
      _method = _this.method;
    } else if (_this.method === undefined || _this.method === null) {
      _method = 'post';
    } else{
      throw new Error('Request method `'+_this.method + '` is not allowed')
    }
  } catch (err) {
    error(err);
  }
}

class TableComponent extends Component {
  constructor(props) {
    super(props)
    // 全局变量重置默认值
    page = 'page'; // 页码变量
    pageSize = 'pageSize'; // 页条数
    totalCount = 'totalCount'; // 总条数
    unselectPar = undefined; // 不可选判断字段
    list = 'list'; // 列表
    _method = 'post'; // 请求方式
    let _this = this.props.tableData;
    // 请求方式
    setMethod(_this);
    
    // 判断是否使用新页面参数
    if (_this.changePageParam && Object.keys(_this.changePageParam).length > 0) {
      this.newParam(_this.changePageParam);
    }
    this.state = {
      data: [],
      pageData: { 
        [pageSize]: 10,
        [page]: 1,
      }, 
      // 分页参数
      pagination: {
        position: 'bottom',
        total: 0,
        showTotal: total => `共计 ${total} 条`,
        pageSize: 10,
        pageSizeOptions: ['10', '20', '50', '100'],
        showSizeChanger: true,
        // 页码、条数变化回调
        onShowSizeChange: this.pageSizeChange,
        onChange: this.pageChange,
        current: 1
      },
      // 加载中
      loading: true,
      size: 'default',
      columns: [], // 列数据
      addParam: {}, // 全局参数字段存放
      screenParam: {}, // 筛选参数字段存放
      selectedRowKeys: [], // Check here to configure the default column
      checkboxPropsKey: undefined, // 多选比较值
      unselect: undefined, // 列表不可选
      unselectType: true, // 判断类型，相等不可选还是不等时不可选
    }
    // console.log(this.state.pagination);
  }
  componentWillMount() {
    let _this = this.props.tableData;
    // 添加序号
    if (_this.lineIndex) {
      const index = {
        title: '序号',
        // width: 70, 
        align: 'center',
        render: (text, record, index) => `${index + 1 + (this.state.pageData[page] - 1) * this.state.pageData[pageSize]}`
      }
      _this.columns.unshift(index); // 数组头部插入
    }
    // 添加内容溢出处理
    if (_this.handleOverflow) { // 全局溢出处理
      for (const key in _this.columns) {
        if (_this.columns.hasOwnProperty(key)) {
          const element = _this.columns[key];
          if (element.width && !element.render) {
            _this.columns[key]['onCell'] = () => {
              return {
                style: {
                  maxWidth: element.width,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow:'ellipsis',
                  cursor:'pointer'
                }
              }
            }
            _this.columns[key]['render'] = (text) => <Tooltip placement="topLeft" title={text}>{text}</Tooltip>
          } else if (element.width && element.render){ // 存在render属性时不生效
            // message.warn('第'+(Number(key)+1)+'列render属性已经存在！请移除后再设置溢出处理。')
          }
        }
      }
    } else {
      // 不做全局处理，单独每一列的溢出处理
      for (const key in _this.columns) {
        if (_this.columns.hasOwnProperty(key)) {
          const element = _this.columns[key];
          if (element.width && !element.render && element.overflow) {
            _this.columns[key]['onCell'] = () => {
              return {
                style: {
                  maxWidth: element.width,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow:'ellipsis',
                  cursor:'pointer'
                }
              }
            }
            _this.columns[key]['render'] = (text) => <Tooltip placement="topLeft" title={text}>{text}</Tooltip>
          }
        }
      }
    }
    const param = {
      ...this.state.pageData,
      ..._this.addParams,
    }
    
    this.setState({
      pageData: {
        ...param
      },
      addParam: _this.addParams, // 储存新参数
      columns: _this.columns,
      size: _this.size,
    })
    
// 尺寸设置
    if (_this.size) this.setState({ size: _this.size });
    // 假数据使用
    if (_this.falseData) { 
      this.setState({ data: _this.falseData, loading: false });
    } else { this.getData(param) }
  }
  /**
   * 自定义请求体、返回体
   * @param _newParam 新参数
   */
  newParam(_newParam){
    let arrKeys = Object.keys(_newParam);
    arrKeys.map( name =>{
      if (name === 'pageSize') { pageSize = _newParam.pageSize; return name; } 
      if (name === 'page') { page = _newParam.page; return name; }
      if (name === 'totalCount') { totalCount = _newParam.totalCount; return name; }
      if (name === 'list') { list = _newParam.list; return name; }
      return undefined;
    })
  }
  /** ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓----------向外开放方法--------↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
  /**
   * 接收外部数据
   * @param data 显示数据
   */
  inputData = (data) => {
    this.setState({
      data
    })
  }
  /**
   * 传入新参数进行筛选
   * @param p 新参数（为空表示重置）
   */
  inputParam(p = {}) {
    let param = {};
    if (Object.keys(p).length === 0) {
      param = {
        ...this.state.addParam, // 全局字段
        [pageSize]: this.state.pageData[pageSize],
        [page]: 1, // 页码
      }
      // 将新增参数写入state,避免分页报错
      this.setState({
        pageData: {
          ...param
        },
        pagination: {
          ...this.state.pagination,
          current: 1
        },
        screenParam: {},
      })
    } else {
      param = {
        ...this.state.pageData,
        [page]: 1, // 页码
        ...this.state.addParam, // 全局字段
        ...p,
      }
      // 将新增参数写入state,避免分页报错
      this.setState({
        pageData: {
          ...this.state.pageData,
        	[page]: 1, // 页码
        },
        pagination: {
          ...this.state.pagination,
          current: 1
        },
        screenParam: p,
      })
    }
    this.getData(param);
  }
  /**
   * 多选后不可选设置
   * @param key 判断值
   */
  setCheckboxProps (key){
    // 判断多选启用
    if (this.props.tableData.rowSelection) {
      this.setState({
        checkboxPropsKey: key
      })
      this.getCheckboxProps(null, key)
    }
  }
  /**
   * 表格不可选条目设置
   * @param param 字段
   * @param key 不可选判断
   * @param type 判断类型（true：record[unselectPar] === unselect是不可选，false：record[unselectPar] !== unselect是不可选）
   */
  setUnselect(param, key, type=undefined){
    unselectPar = param;
    this.setState({unselect: key})
    if (type === false) {
      this.setState({unselectType: false})
    } else {
      this.setState({unselectType: true})
    }
    this.getCheckboxProps(null, undefined, key)
  }

  /**
   * 表格刷新
   */
  refresh() {
    const { addParam, screenParam, pageData } = this.state
    const param = {
      ...addParam, 
      ...screenParam, 
      ...pageData
    }
    this.getData(param)
    this.setState({ selectedRowKeys: [] }) // 多选清空
  }
  // 清除多选
  cleanSelectedRow(){
    this.setState({selectedRowKeys: []}) // 多选清空
  }

  /** ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓----------组件内部函数--------↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ */
  /**
   * 递归操作，获取随机返回体内的列表参数
   * 当对象中存在 list 和 totalCount 是基本可以确定这就是所需要的列表参数
   * 再加以列表长度判断，虽然这样基本能保证列表参数的唯一星，但是还有极概率存在出现问题
   * 长度判断担心不可靠，故暂未加上。
   */
  traverse(obj) {
    if (obj[list] && !isNaN(obj[totalCount])) {
      if (this.state.pageData[pageSize] !== obj[list].length) log('列表长度不等于页条数');
      return obj;
    } else {
      for (let a in obj) {
        if (typeof(obj[a]) === 'object') return this.traverse(obj[a]); //递归遍历
      }
    }
  }
  /**
   * 获取表格数据
   * @param p 参数
   */
  getData(p) {
    let _this = this.props.tableData;
    // 请求方式再设置（tabs切换时不会刷新标签页内容，所以需要重置请求体
    // 否则两个标签页请求体不同时点击切换标签页并跳转页会报405错误）
    setMethod(_this);
    // 参数再设置（同个页面两个table相互切换时，tableData会更新转换，
    // 但是自定义参数不会转换，需要手动判断）
    if (_this.changePageParam && Object.keys(_this.changePageParam).length > 0) {
      this.newParam(_this.changePageParam);
    }
    if (_this.url) {
      // 筛选换页加载中样式
      this.setState({
        loading: true
      });
      // 获取表格显示数据
      api[_method](_this.url, p).then(res => {
        res = this.traverse(res); // 污染原始数据
        if (res[list].length > 0) {
          // 表格数据添加key值
          let index;
          for (const key in res[list]) {
            if (res[list].hasOwnProperty(key)) {
              index = p[pageSize]*(p[page] - 1) + Number(key)
              res[list][key]['onlyKey'] = index;
            }
          }
          this.setState({
            pagination: {
              ...this.state.pagination,
              total: res[totalCount],
            },
            loading: false, // 关闭加载中
          })
          if (_this.dataToOut) {
            this.props.getTableDatas(res); // 表格数据外送处理
          } else {
            this.setState({
              data: res[list],
            })
          }      
        } else {
          // message.warn('获取列表信息为空！')
          if (_this.dataToOut) this.props.getTableDatas(res); // 表格数据外送处理
          this.setState({
            loading: false,
            data: [],
            pagination: {
              ...this.state.pagination,
              total: res[totalCount],
            },
          })
        }
      }).catch(err => { 
        if (_this.dataToOut) this.props.getTableDatas(); // 表格数据外送处理
        this.setState({
          loading: false,
          data: [],
          pagination: {
            ...this.state.pagination,
            total: 0,
          },
        })
        // message.error('获取信息失败！')
        log('err: '+ err);
      })
    } else {
      // message.error('接口路径不得为空!')
      log('接口路径不得为空!')
      this.setState({
        loading: false
      })
    }
  }
  // 页码改变事件
  pageChange = (newPage) => {
    let pageData = {
      [pageSize]: this.state.pageData[pageSize], // 每页的记录数字
      ...this.state.addParam,
      ...this.state.screenParam
    }
    pageData[[page]] = newPage;
    this.setState({
      // selectedRowKeys: [], // 清空多选
      pageData: {
        [page]: newPage,
        [pageSize]: this.state.pageData[pageSize],
      },
      pagination: {
        current: newPage, // 当前页高亮
      }
    })
    this.getData(pageData);
  };

  // 页显示条数改变事件
  pageSizeChange = (e, newPageSize) => {
    this.setState({
      pageData: {
        [page]: 1,
        [pageSize]: newPageSize
      },
      pagination: {
        ...this.state.pagination,
        pageSize: newPageSize,
        current: 1
      }
    })
    const pageData = {
      [pageSize]: newPageSize, // 每页的记录数字
      [page]: 1, // 页码
      ...this.state.addParam,
      ...this.state.screenParam
    }
    this.getData(pageData);
  };
  // 多选回调函数
  onSelectChange = (selectedRowKeys, selectedRows) => {
    // console.log(selectedRowKeys);
    if (selectedRows.length === 0) {
      this.setState({checkboxPropsKey: undefined})
    }
    this.setState({ selectedRowKeys });
    this.props.getSelectData(selectedRows);
  };
  /**
   * 多选设置
   * @param record 列表
   * @param key 选择后不可选key值
   * @param unselect 列表不可选设置
   */
  getCheckboxProps = (record, key=undefined, unselect=undefined) => {
    if (record !== null && key !== undefined) {
      return({
        disabled: record.onlyKey !== key, // Column configuration not to be checked
      })
    }
    if (record !== null && key === undefined && unselect !== undefined) {
      if (this.state.unselectType) {
        return({
          disabled: record[unselectPar] === unselect, // 相等时不可选
        })
      } else {
        return({
          disabled: record[unselectPar] !== unselect, // 不等时不可选
        })
      }
    }
  };

  render() {
    let _this = this.props.tableData;
    if (_this.changePageParam && Object.keys(_this.changePageParam).length > 0) {
      this.newParam(_this.changePageParam);
    }
    const tableList = {
      pagination: this.state.pagination,
      loading: this.state.loading,
    };
    const { selectedRowKeys } = this.state;
    const columns = this.state.columns;
    // 多选
    const Selection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
      getCheckboxProps: (e) => this.getCheckboxProps(e, this.state.checkboxPropsKey, this.state.unselect),
    };
    const rowSelection = this.props.tableData.rowSelection ? Selection : null
    return (
      <div>
        <Table
          {...tableList}
          size={this.state.size}
          rowKey={(record, index) => `${record.onlyKey}`}
          bordered
          dataSource={this.state.data}
          rowSelection={rowSelection}
          columns={columns}
          scroll={this.props.tableData.scroll}
        >
        </Table>
      </div>
    )
  }
}
// 指定 props 的默认值：
TableComponent.defaultProps = {

};
TableComponent.propTypes = { //.propTypes是react规定的名称,不可以修改
  tableData: PropTypes.shape({
    url: PropTypes.string.isRequired, // 路径类型
    rowSelection: PropTypes.bool, // 复选标识
    lineIndex: PropTypes.bool, // 序号标识
    columns: PropTypes.array.isRequired, // 列参数
    dataToOut: PropTypes.bool, // 数据外传标识
    addParams: PropTypes.object, // 新增参数
    size: PropTypes.oneOf(['default', 'middle', 'small']), // 表格尺寸
    handleOverflow: PropTypes.bool, // 全局溢出处理，不需要再单独每个列设置（设置后忽略单独设置）
    falseData: PropTypes.array, // 假数据
    method: PropTypes.oneOf(['get', 'post']), // 请求方式
    changePageParam:PropTypes.objectOf(function(propValue, key, componentName, location, propFullName) {
      let allowKeys = [ 'pageSize', 'page', 'totalCount', 'list' ]
      if (allowKeys.indexOf(key) < 0 ) { 
        return new Error(
          'Invalid prop `' + componentName + '` supplied to' +
          ' `' + propFullName + '`. Validation failed.'
        );
      }
    }), // 替代页面参数
    scroll: PropTypes.object, // 滚动配置
  }),

  // 列新参数说明（由于不知道怎么设置tableData.columns的参数类型，
  // 所以暂放在这，但组件没有这个参数）
  Columns: PropTypes.shape({
    overflow: PropTypes.bool, // 列移除处理（移除显示省略号...）
  })
};

export default TableComponent;

