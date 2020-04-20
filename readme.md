

# react 表格组件使用说明

#### 基础使用

<!--引入-->

`import ITable from '@/components/Table/index';`  

<!--使用-->

`<ITable tableData={tableData} />`

<!--返回体要求（详见版本#1.2.3说明）-->

```json
{
    "result":true,
    "data":{
        "list":[...list...],
        "current":1,
        "pageSize":10,
        "totalCount":57
    }
}
```

------



##### tableData参数说明

| 参数            | 说明                                          | 类型                       | 默认值  | 版本  |
| --------------- | --------------------------------------------- | -------------------------- | ------- | ----- |
| url             | 接口路径                                      | string                     | --      | 1.0.0 |
| size            | 表格大小                                      | default \| middle \| small | default | 1.0.0 |
| rowSelection    | 是否打开多选                                  | boolean                    | false   | 1.0.0 |
| columns         | 列参数（参看antd-table）                      | array                      | --      | 1.0.0 |
| dataToOut       | 数据是否外送处理                              | boolean                    | false   | 1.0.0 |
| addParams       | 新增请求参数（见说明1）                       | object                     | --      | 1.1.0 |
| lineIndex       | 排序                                          | boolean                    | false   | 1.1.0 |
| handleOverflow  | 全局溢出处理                                  | boolean                    | false   | 1.2.0 |
| falseData       | 假数据字段                                    | array                      | --      | 1.2.0 |
| changePageParam | 新页码、条数、总条数、列表属性参数（见说明2） | object                     | --      | 1.2.3 |
| method          | 请求方式                                      | post \|  get               | post    | 1.2.3 |

```javascript
const tableData = {
      url: 'xx/xx/xxx',
      lineIndex: true,
      rowSelection: false,
      method: 'post',
      columns: [{
          title: '姓名',
          dataIndex: 'name',
          align: 'center',
        },{...
        },{
          title: '操作',
          align: 'center',
          render: (record) => (
            <span>
              <span style={{color: '#1890ff',cursor: 'pointer'}} onClick={function}>查看</span>
              <Divider type="vertical" />
              <span style={{color: '#1890ff',cursor: 'pointer'}} onClick={function}>编辑</span>
            </span>
          )
        }]
    }
```

***说明：***

1. addParams传入新参数后无法清除，伴随组件终身，如需使用过程中删除可调用inputParam() 方法实现。

2. changePageParam修改默认的页码、页条数、总条数字段，**用于后端列表请求体未统一时**。例子：

   ```javascript
   const tableData = {
         url: ...,
         lineIndex: true, // 序号
         rowSelection: true, // 多选
         changePageParam: {page:'pageNo',totalCount:'total',pagesize:'xxx',list: 'list'},
         columns: [{...}]
   ```

   changePageParam对象的key值只能为page（页码）、totalCount（列表总条数）、pagesize（页条数），如果key值不是这三个中的一个控制台会报相应的错误，报错如下：![](E:\代码\Table\img\报错截图.png)

   在1.2.3版本中新增返回体自定义参数list，用法：*changePageParam: {totalCount:'自定义总条数参数'list: '自定义列表参数'}*，key值不是list以前上个版本的三个同样会报错。

##### columns参数说明

| 参数     | 说明           | 类型    | 默认值 | 版本  |
| -------- | -------------- | ------- | ------ | ----- |
| overflow | 单独列溢出处理 | boolean | false  | 1.2.0 |



##### 外送数据参数说明

| 方法          | 说明                                 | 类型           | 版本  |
| ------------- | ------------------------------------ | -------------- | ----- |
| getTableDatas | 外送数据处理参数（用于复杂数据过滤） | Function(data) | 1.0.0 |
| getSelectData | 外送多选选中数据                     | Function(data) | 1.0.0 |

```javascript
<ITable 
    ref={ ITable => this.table = ITable } 
    tableData={attendanceData} 
    getTableDatas={this.handleData}
    getSelectData={this.handleSeleteData} />
/**
  * 多选数据处理
  * @param e 多选选中数据
  */
handleSeleteData(e){
   console.log(e);
}
/**
  * 外送数据处理
  * @param e 外送数据
  */
handleData(e){
   console.log(e);
}
```



##### 效果

![image-20191223171713951](E:\代码\Table\img/效果截图.png)

#### 方法说明

| 方法             | 说明                                                         | 类型                     | 版本  |
| ---------------- | ------------------------------------------------------------ | ------------------------ | ----- |
| inputData        | 外送数据处理后返回表格再显示                           （用于复杂数据过滤） | Function(data)           | 1.0.0 |
| inputParam       | 传入新参数进行筛选                                           | Function(object)         | 1.0.0 |
| setCheckboxProps | 单选后其他不可选中                                           | Function(key)            | 1.1.3 |
| refresh          | 表格刷新功能                                                 | Function()               | 1.2.0 |
| setUnselect      | 设置不可选择条目                                             | Function(param,key,type) | 1.2.2 |
| cleanSelectedRow | 清除已选中                                                   | Function()               | 1.2.4 |

##### 举例说明

```javascript
 <ITable 
    ref={ ITable => this.table = ITable } 
    tableData={tableData} 
    getTableDatas={this.handleData} /> 

/**
   * 表格信息处理函数
   * @param e 表格外送数据
   */
  handleData = (e) => {    
    let data = e.list;
    // 外送数据处理
    // 。。。。 
    this.table.inputData(data); // 回传组件显示
  }
    
 /**
   * 搜索、重置
   * @param e 事件
   * @param status 搜索/重置标志位（true：搜索，false：重置）
   */
  handleSearch = (e, status) => {
    e.preventDefault();
    if (status) {
      const keyword = this.props.form.getFieldValue('key');
      this.table.inputParam({nameOrProjectCode: keyword}); // 传入请求参数实现筛选
    } else {
      // 重置移除插入参数
      this.props.form.setFieldsValue({ key: '' });
      this.table.inputParam({nameOrProjectCode: null}); // 传入请求参数实现筛选
    }
  };
 /**
   * 单选后其余不可选中
   * @param list 选中条目
   */
  getSelectData=(list)=>{
    if (list.length === 1) {
      this.table.setCheckboxProps(list[0].key) // 传入key值进行比较使用
    }
  }
 /**
   * 不可选设置
   * @param param 表格某个字段
   * @param key 不可选判断目
   * @param type 判断类型true：record[param]===key是不可选，false：record[param]!==key是不可选
   */
  componentDidMount(){
    this.table.setUnselect('addStatus', 1, false)
  }

```

#### 待处理问题

1. 当页面中有三个表格时且page和pageSize都不一样时打开另一个表格其他的序号会变为NaN且请求也会顺带出错
2. 分页可以优化下使用antd table自带的anchange回调
3. 溢出处理也可以使用antd table自带的属性

#### 更新说明

##### 版本汇总

| 版本号 | 发行时间   | 更新内容                                       |
| ------ | ---------- | ---------------------------------------------- |
| 1.0.0  | 2019.12.31 | 新增分页、多选、筛选等基础功能                 |
| 1.1.0  | 2020.01.13 | 多选数据外送、排序、表格大小设置功能           |
| 1.1.1  | 2020.01.14 | 完善重置功能，传空值则重置                     |
| 1.1.2  | 2020.02.06 | 修复翻页多选不清除问题                         |
| 1.1.3  | 2020.02.10 | 单选后其他不可选中功能（setCheckboxProps）     |
| 1.2.0  | 2020.02.11 | 新增内置内容溢出处理、假数据显示、手动刷新功能 |
| 1.2.1  | 2020.02.14 | 优化请求体页码、页条数、总条数可修改           |
| 1.2.2  | 2020.02.17 | 新增条目不可选设置                             |
| 1.2.3  | 2020.02.26 | 新增自定义返回体、get请求方式                  |
| 1.2.4  | 2020.03.19 | bug修复，同步scroll滚动条属性                  |
| 1.2.5  | 2020.04.13 | 修复已知bug                                    |

##### 版本说明

###### # 1.0.0

基础版本，包含分页。多选、筛选、复杂数据外送过滤等基础表格功能

###### # 1.1.0

1. 解决表格分页后排序不连续问题；
2. 新增多选数据外送、设置表格尺寸大小功能

###### # 1.1.1

上个版本重置需要将输入字段手动置空处理：

​	~~this.table.inputParam({corpName: '',proCorpCode: undefined});~~

现在完善传入空值既重置：

​	this.table.inputParam();（ps: 当然你也可以延用之前的传入空值进行重置）

###### # 1.1.2

修复多选选中时翻页选中效果依旧存在的问题。

***如果要多页间多选可以在多选触发 getSelectData() 时自行处理***

###### # 1.1.3

新增单选后其他不可选中功能。

*缺点：只能选择一个，因为本身功能使用情况就很少，所以暂不考虑多选情况，待出现多选后不可选中需求再做增加*

###### # 1.2.0

新增内置内容溢出处理、假数据显示、手动刷新功能

**内容溢出处理**：设置handleOverflow=true; 既判断每列参数是否有width属性，有则溢出隐藏用省略号代替溢出部 分（鼠标覆盖显示全部）；单独列处理不设置handleOverflow，在列中设置overflow=true（鼠标覆盖显示全部）；如果不想隐藏只想换行，则设置overflow=false；

**假数据显示**：设置falseData；

**手动刷新功能**：调用refresh，有时需要刷新表格可以用到；

**列开关（未实现）**：之前外部列参数设置rander也能实现，列属性代码如下：

```javascript
title: '联动状态',
dataIndex: 'linkageStatus',
key: 'linkageStatus',
align: 'center',
render: (text, record, index) => {
   return (
      <Popconfirm
          disabled={record.equipStatus !== '启动'}
          title={record.linkageStatus === '0' ? '确定要关闭吗？' : '确定要打开吗？'}
          onConfirm={() => this.connectionChange(index, record.linkageStatus, record.equipmentCode)}
          okText="确定"
          cancelText="取消" >
          <Switch disabled={record.equipStatus !== '在线'} checkedChildren="开启" unCheckedChildren="关闭" checked={record.linkageStatus === '0'}/>
        </Popconfirm>
	)
}
```

所以暂不考虑内置，下个#1.3.0版本有望加入

###### # 1.2.1

优化请求体页码、页条数、总条数可修改

之前这三个参数是不可修改的（page，pageSize，totalCount），这就导致后端请求体、返回体没做统一的时候组件是不可用的。这个版本将这三个参数名设置为变量，就可以灵活设置了。同时限定只能修改这三个参数，否则会报错。

###### # 1.2.2

新增条目不可选设置setUnselect（param, key, type）

###### # 1.2.3

新增自定义返回体、get请求方式

**请求方式设置：**新增method参宿，默认post请求方式，备选get，暂不支持其他请求方式。

**自定义返回体**：changePageParam: {totalCount:'自定义总条数属性名参数'list: '自定义列表属性名参数'}，要求这两个参数在返回体的同一个对象里（多层嵌套也行），且不能有多个列表名一样、列表长度也显示条数一样数据，***例如：***

```json
// 正确
{
    "result":true,
    "data":{
        "list":[...list...],
        "current":1,
        "pageSize":10,
        "totalCount":57
    }
}
// 错误
{
    "result":true,
    "data":{
        "list":[...list...],
        "current":1,
        "pageSize":10,
    },
    "totalCount":57
} 
// 或者
{
    "result":true,
    "data":{
        "list":[...list...], // 名称为list，长度为10
        "current":1,
        "pageSize":10,
        "totalCount":57
    },
    "data":{
        "data":{
            "list":[...list...], // 名称为list，长度为10
            "current":1,
            "pageSize":10,
            "totalCount":57
    	}
    }
}
```

###### # 1.2.4

bug修复，同步scroll滚动条属性

* 同步antd表格组件的scroll属性，用于适应1366分辨率事表格显示错乱问题。
* 修复tabs组件标签页切换不刷新导致请求体不同报405错误，setMethod(params)；
 *              修复同个页面多个组件相互切换时自定义数据不刷新问题；
 *              修复使用假数据是依旧请求接口问题；
 *              新增表格清除多选方法cleanSelectedRow（）；
 *              修复接口请求失败时分页失效问题；
 *              修复条数改变后分页pageSize设置导致分页失效问题；

###### # 1.2.5

修复已知bug

* 修复refresh时可能存在的外送、筛选参数丢失问题，refresh()方法优化
 *              修复筛选参数清除时请求接口筛选参数未清除问题，inputParam()判断优化
 *              修复表格重绘时全局参数重置问题
 *              完善报错时或者请求失败时有外送数据的依旧有数据外送
 *              注释获取数据为空时的提示
 *              滚动条参数同步，新增scroll，用于不同分辨率适配
 *              更改拼写错误字段addPramas为addParams

# react-antdTable-secondEncapsulation
