// import package

// import model
import { Cms } from '../models'

/** 
 * Get Cms List
 * URL : /adminapi/cms
 * METHOD : GET
*/
export const getCmsList = (req, res) => {
    Cms.find({}, { '_id': 1, 'identifier': 1, 'title': 1, 'content': 1, 'image': 1, 'status': 1 }, (err, data) => {
        if (err) {
            return res.status(500).json({ 'success': false, 'message': 'Something went wrong' })
        }
        return res.status(200).json({ 'success': true, 'message': 'Fetch successfully', 'result': data })
    })
}

/** 
 * Update Cms List
 * URL : /adminapi/cms
 * METHOD : PUT
 * BODY : id, identifier, title, content
*/
export const updateCms = async (req, res) => {
    try {
        let reqBody = req.body;

        let checkCmsData = await Cms.findOne({ "_id": reqBody.id });
        if (!checkCmsData) {
            return res.status(400).json({ 'status': false, 'message': 'There is no cms' });
        }

        checkCmsData.identifier = reqBody.identifier;
        checkCmsData.title = reqBody.title;
        checkCmsData.content = reqBody.content;
        await checkCmsData.save();
        return res.status(200).json({ 'status': true, 'message': 'Cms updated successfully' });
    } catch (err) {
        return res.status(500).json({ 'status': false, 'message': 'Something went wrong' });
    }
}

/** 
 * Get CMS Page
 * URL : /api/cms/{{}}
 * METHOD : GET
 * PARAMS : identifier
*/
export const getCMSPage = (req, res) => {
    Cms.findOne({ "identifier": req.params.identifier }, {
        "_id": 0,
        "title": 1,
        "content": 1
    }, (err, data) => {
        if (err) {
            return res.status(500).json({ 'status': false, 'message': 'Something went wrong' });
        }
        return res.status(200).json({ 'status': true, 'message': 'FETCH_SUCCESS', 'result': data });
    })
}