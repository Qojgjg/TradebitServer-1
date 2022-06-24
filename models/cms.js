// import package
import mongoose from 'mongoose';


const Schema = mongoose.Schema;
let cms = new Schema({
	identifier: {
		type: String,
		required: true,
		unique: true
	},
	title: {
		type: String,
		required: true,
	},
	content: {
		type: String,
		required: true,
	},
	image: [],
	status: {
		type: String,
		enum: ['active', 'deactive'],
		default: "active",  //active, deactive
	},
}, {
	timestamps: true
});

const Cms = mongoose.model('cms', cms, 'cms');

export default Cms;