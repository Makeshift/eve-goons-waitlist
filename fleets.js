module.exports = function (setup) {
	var module = {};
	module.list = [];

/*
Fleet object format:

{
	fc: user object,
	backseat: user object,
	type: "hq",
	status: "text",
	location: {
		id: id,
		name: "Jita"
	},
	members: [user objects],
	size: members.length,
	url: "hhttps://esi.tech.ccp.is..."
}

*/

	module.register = function(data) {
		module.list.push(data); //Do I want the calling function to do all the work?
	}


	module.getFCPageList = function() {
		return module.list;
	}


	return modules;
}