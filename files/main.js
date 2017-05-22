var url = 'http://localhost:5984/todos/';
angular.module('todoApp', [])
        .controller('TodoListController', ['$http','$scope', function ($http,$scope) {
                var todoList = this;
                todoList.todos = [];
                todoList.todos_tmp = [];
                todoList.tags = [];
                todoList.tags_tmp = [];
                todoList.activeFilter = 'all';
				var options = [];
				var options_id = 0;
				
				todoList.initValues = function(keys){ 
					if (typeof keys === 'string'){
						var params = '/_design/todos/_view/type?key="'+keys+'"&reduce=false';
					}else{
						var params = '/_design/todos/_view/type?keys='+JSON.stringify(keys)+'&reduce=false';
					}
					
					todoList.loadValues(params);
					todoList.activeFilter = 'all';
				}
				
				todoList.loadValues = function(params){ 
					$http.get(url + params)
						.then(function (response) {
							var data = response.data;
							todoList.todos_tmp = [];
							todoList.tags_tmp = [];
							angular.forEach(data.rows, function (raw) {
								if(raw.value.type == 'tag'){
									var td = {_id: raw.id, _rev: raw.value._rev, type: 'tag', text: raw.value.text, selected: false};
									todoList.tags_tmp.push(td);
								}else{
									if(raw.value.parent==0){
										var td = {_id: raw.id, _rev: raw.value._rev, type: 'todoitem', hasChildren: raw.value.hasChildren, text: raw.value.text, allTags: [], selTags: raw.value.selTags || [], done: raw.value.done, showadd: raw.value.showadd, parent: raw.value.parent, donenr:0, todos: []};
										todoList.todos_tmp.push(td);
									}else{
										angular.forEach(todoList.todos_tmp, function (t) {
											if(t._id==raw.value.parent){
												var td = {_id: raw.id, _rev: raw.value._rev, type: 'todoitem', hasChildren: raw.value.hasChildren, text: raw.value.text, allTags: [], selTags: raw.value.selTags || [], done: raw.value.done, showadd: raw.value.showadd, parent: raw.value.parent, donenr:0};
												t.todos.push(td);
											}
										});
									}
								}
							});
							if(todoList.tags_tmp.length){
								todoList.tags = angular.copy(todoList.tags_tmp);
							}
							
							if(todoList.todos_tmp.length){
								angular.forEach(todoList.todos_tmp, function (raw) {
									raw.allTags = angular.copy(todoList.tags);
									angular.forEach(raw.allTags, function (tags) {
										if(raw.selTags.indexOf(tags._id)!==-1){
											tags.selected = true;
										}
									});
									angular.forEach(raw.todos, function (rtodo) {
										rtodo.allTags = angular.copy(todoList.tags);
										angular.forEach(rtodo.allTags, function (tags) {
											if(rtodo.selTags.indexOf(tags._id)!==-1){
												tags.selected = true;
											}
										});	
									});
								});
								todoList.todos = angular.copy(todoList.todos_tmp);
							}
						});
				}

                todoList.showInput = function (cat, w) {
					if(w == 'showtags'){
						todoList.createDropdowns();
					}
                    cat[w] = !cat[w];
                };

                todoList.EditCat = function (cat) {
                    cat.showedit = !cat.showedit;
                    todoList.addToDB(cat);
                };

                todoList.EditTag = function (tags) {
                    tags.showedit = !tags.showedit;
                    todoList.addToDB(tags);
                };
				
				todoList.showRemoveTag = function (tags) {
					todoList.displayDeletePopup = !todoList.displayDeletePopup;
                    todoList.sTagId = tags._id+'?rev='+tags._rev;
                };

				todoList.removeTag = function (id) {
					todoList.displayDeletePopup = !todoList.displayDeletePopup;
					todoList.removeFromDB(id);					
				};
				
                todoList.addTodo = function () {
					var td = {text: todoList.todoText, type: 'todoitem', hasChildren:false, done: false, showadd: false, parent: 0, todos: []};
                    todoList.todos.push(td);
                    var td = {text: todoList.todoText, type: 'todoitem', hasChildren:false, done: false, showadd: false, parent: 0};
					todoList.addToDB(td);
                    todoList.todoText = '';
                };

				todoList.addTag = function () {
					var td = {type: 'tag', text: todoList.tags.newtag, selected: false};
					todoList.tags.push(td);
					todoList.addToDB(td);
					todoList.tags.newtag = '';
					todoList.tags.showedit = false;
				};
				
				todoList.filterByTag = function (tag) {
					todoList.activeFilter = tag;
					if(tag == 'all'){
						keys = ["todoitem","tag"];
						var params = '/_design/todos/_view/type?keys='+JSON.stringify(keys)+'&reduce=false';
						todoList.loadValues(params);
					}else{
						$http.get(url + '_design/todos/_view/tags?startkey=["'+tag+'"]&endkey=["'+tag+'",{}]')
							.then(function (response) {
								var ids = [];
								var data = response.data;
								angular.forEach(data.rows, function (d) {
									ids.push(d.value);
								});
								ids.sort();
								var params = '/_design/todos/_view/byIds?keys='+JSON.stringify(ids)+'&reduce=false';
								todoList.loadValues(params);
							});
					}
				};
				
                todoList.addTodoToCat = function (cat) {
					var td = [];
                    if (cat.newtodo) {
						var td = {text: cat.newtodo, type: 'todoitem', done: false, showadd: false, parent: cat._id};
						cat.todos.push(td);
						cat.selTags = [];
						cat.hasChildren  = true; 
                    }
                    
                    cat.newtodo = '';
                    cat.showadd = !cat.showadd;
                    cat.done = false;
					if(td){
						todoList.addToDB(td,cat);
					}
                };

                todoList.isCatDone = function (cat) {
                    angular.forEach(todoList.todos, function (cats) {
                        if (cats.text == cat) {
                            if (cats.todos.length) {
                                cats.done = true;
                                angular.forEach(cats.todos, function (todo) {
                                    if (!todo.done) {
                                        cats.done = false;
                                    }
                                });
                            }
                        }
                    });
                };

                todoList.remaining = function (cat) {
                    var count = 0;
                    angular.forEach(todoList.todos, function (cats) {
                        if (cats.text == cat) {
                            angular.forEach(cats.todos, function (todo) {
                                count += todo.done ? 0 : 1;
                            });
                        }
                    });
                    return count;
                };
				
                todoList.addToDB = function (sdata, categ) {
					var tmp = angular.copy(sdata);
					if(typeof tmp.todos !== undefined){
						delete tmp.todos;
					}
                    $http.post(url, tmp)
						.then(function (response) {
							var data = response.data;
							var status = response.status;

							if(categ){
								tmp = angular.copy(categ);
								if(typeof tmp.todos !== undefined){
									delete tmp.todos;
								}
								$http.post(url, tmp)
								.then(function (response) {
									var data = response.data;
									var status = response.status;
									todoList.initValues(['todoitem','tag']);
								});
							}else{
								todoList.initValues(['todoitem','tag']);
							}
						});
                }
				
                todoList.removeFromDB = function (id) {
                    $http.delete(url+id, {})
						.then(function (response) {
							var data = response.data;
							var status = response.status;

							//console.log(status);
							todoList.initValues(['todoitem','tag']);
						});
                }

				//some jquery
				todoList.createDropdowns = function(){ 
					$('.multiselect').multiselect('destroy').multiselect({
						onChange: function(option, checked, select) {
							var svalues = $(option).parent().val(); 
							var opselected = $(option).val().split('|');
							options_id = opselected[1];
							opselected = opselected[0];
							
							options = [];
							angular.forEach(svalues, function (v) {
								var tmp = v.split("|");
								options.push(tmp[0]);
							});
						},
						onDropdownHide: function(event) {
							//update tags for selected ToDo
							angular.forEach(todoList.todos, function (raw) {
								raw.showtags = false;
								if(options_id!==0 && raw._id==options_id){
									if(options.length){
										raw.selTags = options;
									}else{
										delete raw.selTags;
									}
									todoList.addToDB(raw);
									options = [];
								}
								angular.forEach(raw.todos, function (rt) {
									rt.showtags = false;
									if(options_id!==0 && rt._id==options_id){
										if(options.length){
											rt.selTags = options;
										}else{
											delete rt.selTags;
										}
										todoList.addToDB(rt);
										options = [];
									}
								});
							});
							options_id = 0;
						}
					}).multiselect('refresh');
					$('.multiselect').next().find('button').removeClass('btn-default').addClass('btn-sm');
				};
            }]).directive('a', function() {
				return {
					restrict: 'E',
					link: function(scope, elem, attrs) {
						if(attrs.ngClick || attrs.href === '' || attrs.href === '#'){
							elem.on('click', function(e){
								e.preventDefault();
							});
						}
					}
			   };
			});
			