app.section('languageEnviroment');

viewModel.languageEnviroment = {}; var lang = viewModel.languageEnviroment;

lang.templateFilter = {
	search: "",
	os: "",
};

lang.templateSetupLangEnv = {
	ServerId:"",
	Lang:""
}

lang.filter = ko.mapping.fromJS(lang.templateFilter);
lang.SetupLangEnv = ko.mapping.fromJS(lang.templateSetupLangEnv); 
lang.dataLanguage = ko.observableArray([]);
lang.langEnvData = ko.observable([]);
lang.breadcrumb = ko.observable('');
lang.serverlanguage = ko.observableArray([]);

lang.getserverlanguage = function (c){
	var param = ko.mapping.toJS(lang.filter);
	var data;
	app.ajaxPost("/langenvironment/getserverlanguage",{}, function (res){
		if (!app.isFine(res)){
			return
		}
		if (res.data == null){
			res.data = [];
		}
		lang.dataLanguage(res.data)
		if (param.search != '' || param.os != ''){
			if (param.search != '' && param.os){
				data = Lazy(lang.dataLanguage()).filter({ServerID:param.search},{ServerOS:param.os} ).toArray();
				lang.setGrid(data)
			}
			if (param.search != ''){
				data = Lazy(lang.dataLanguage()).filter({ServerID:param.search}).toArray();
				lang.setGrid(data)
			}
			if (param.os != ''){
				data = Lazy(lang.dataLanguage()).filter({ServerOS:param.os}).toArray();
				lang.setGrid(data)
			}	
		}else {
			lang.setGrid(lang.dataLanguage())	
		}
	});
	$('.pleasewait').remove();	
}

lang.setupLangEnviroment = function (param){
	console.log(param);
	$('.btn-language').prop('disabled', true);
	app.ajaxPost("/langenvironment/setupfromsh", param, function (res) {
		if (!res.success) {
			sweetAlert("Oops...", res.message, "error");
			lang.getserverlanguage();
			return;
		}	
		swal({title: param.Lang+" language successfully install", type: "success", closeOnConfirm: true});
		lang.getserverlanguage();
	});
}

lang.removeLangEnviroment = function(param){
	console.log(param);
	$('.btn-language').prop('disabled', true);
	app.ajaxPost("/langenvironment/uninstalllang", param, function (res){
		if (!res.success){
			sweetAlert("Oops...", res.message, "error");
			lang.getserverlanguage();
			return;
		}
		swal({title: param.Lang+" language successfully uninstall", type: "success", closeOnConfirm: true});
		lang.getserverlanguage();
	})
}


function getAttr(serverid,language, check){
	var param = ko.mapping.toJS(lang.SetupLangEnv);
	param.ServerId = serverid; 
	param.Lang = language;

	if (check == "false"){
		lang.setupLangEnviroment(param);	
	}else {
		lang.removeLangEnviroment(param);
	}
} 

lang.setGrid = function(data){
	var columnGrid = [
		{field : "_id", title : "Server ID"},
		{field : 'os', title : 'Server OS'},
		{field : "host", title : "Host"},
	];

	var dataGrid = [];
	data.forEach(function(d, i){
		var each = {
			_id:d.ServerID,
			os:d.ServerOS,
			host:d.ServerHost
		}
		d.Languages.forEach(function(e){
			each[e.Lang] = e.IsInstalled;
			if (i == 0){
				columnGrid.push({
					width:"130px",
					title:"<center>"+e.Lang+"</center>",
					template: function (f){
					var checkDisable = '';
					checkDisable = f[e.Lang];
					if (checkDisable == true){
						return ["<center><button class=\"btn btn-sm btn-default btn-start btn-text-danger tooltipster tooltipstered \"title=\"uninstall\" onClick=\"getAttr('"+f._id+"','"+e.Lang+"','"+checkDisable+"'), miniloader()\" ><span class=\"glyphicon glyphicon-remove\"></span></button></center>"].join(" ");
						} else {
						return ["<center><button class=\"btn btn-sm btn-default btn-text-success btn-start tooltipster tooltipstered\" title=\"install\" onClick=\"getAttr('"+f._id+"','"+e.Lang+"','"+checkDisable+"'), miniloader()\" language =\""+e.Lang+"\" ><span class=\"glyphicon glyphicon-cog\"></span></button></center>"].join(" ");	
						}
					}
				});
			}
		});
		dataGrid.push(each)
	});

	$('.grid-langEnvi').kendoGrid({
		dataSource: {data:dataGrid, pageSize:15},
		columns:columnGrid,
		pageable: true,
		filterfable: false,
		dataBound:app.gridBoundTooltipster('.grid-langEnvi')
	});
}

function miniloader() {
	$('.pleasewait').remove();
	$('.loaderlangEnv').find('.loader').after("<div class='pleasewait'></div>");
	$('.loaderlangEnv').find('.loader').next().append("<br><br><br><center><h3 style='margin-left: -40px;'>Please Wait</h3></center>");
}

$(function () {
	lang.getserverlanguage();
	app.registerSearchKeyup($('.searchLangEnv'), lang.getserverlanguage);
});
