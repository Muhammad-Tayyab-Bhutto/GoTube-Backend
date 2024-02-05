import mongoose, {Schema} from 'mongnoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, 
        },
        thumbnail: {
            type: String,
            required: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        title: {
            type: String,
            required: true,
            maxlength: 60,
        },
        duration: {
            type: Number,
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        likes: {
            type: Number,
            default: 0
        },
        dislikes: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            required: true,
        },
    }, 
    {timestams: true}
);

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model('Video', videoSchema);