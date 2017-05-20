var url = 'http://localhost:5984/todos/';
angular.module('todoApp', [])
        .controller('TodoListController', ['$http', function ($http) {
                var todoList = this;
                todoList.todos = [];
                todoList.todos_tmp = [];
				
				todoList.initValues = function(){ 
					$http.get(url + '/_all_docs?include_docs=true&conflicts=true')
						.then(function (response) {
							var data = response.data;
							todoList.todos_tmp = [];
							angular.forEach(data.rows, function (raw) {
								if(raw.doc.parent==0){
									var td = {_id: raw.id, _rev: raw.doc._rev, text: raw.doc.text, done: raw.doc.done, showadd: raw.doc.showadd, parent: raw.doc.parent, donenr:0, todos: []};
									todoList.todos_tmp.push(td);
								}else{
									angular.forEach(todoList.todos_tmp, function (t) {
										if(t._id==raw.doc.parent){
											var td = {_id: raw.id, _rev: raw.doc._rev, text: raw.doc.text, done: raw.doc.done, showadd: raw.doc.showadd, parent: raw.doc.parent, donenr:0};
											t.todos.push(td);
										}
									});
								}
							});
							todoList.todos = todoList.todos_tmp;
						});
				}

                todoList.showInput = function (cat) {
                    cat.showadd = !cat.showadd;
                };

                todoList.showEdit = function (cat) {
                    cat.showedit = !cat.showedit;
                };

                todoList.EditCat = function (cat) {
                    cat.showedit = !cat.showedit;
                    todoList.addToDB(cat);
                };

                todoList.addTodo = function () {
					var td = {text: todoList.todoText, done: false, showadd: false, parent: 0, todos: []};
                    todoList.todos.push(td);
                    var td = {text: todoList.todoText, done: false, showadd: false, parent: 0};
					todoList.addToDB(td);
                    todoList.todoText = '';
                };

                todoList.addTodoToCat = function (cat) {
					var td = [];
                    if (cat.newtodo) {
						var td = {text: cat.newtodo, done: false, showadd: false, parent: cat._id};
						cat.todos.push(td);
                    }
                    
                    cat.newtodo = '';
                    cat.showadd = !cat.showadd;
                    cat.done = false;
					if(td){
						todoList.addToDB(td);
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

				todoList.updateDBTodo = function (todo) {
					var tmp = todo;
					delete tmp.todos;
					todoList.addToDB(tmp);
				}
				
                todoList.addToDB = function (data) {
                    $http.post(url, data)
						.then(function (response) {
							var data = response.data;
							var status = response.status;

							console.log(status);
							todoList.initValues();
						});
                }

            }]);