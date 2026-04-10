import mongoose from 'mongoose';
import slugify from 'slugify';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a project title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    thumbnail: {
      type: String,
      default: 'no-photo.jpg',
    },
    images: {
      type: [String],
    },
    videos: {
      type: [String],
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
    },
    tags: {
      type: [String],
    },
    client: {
      type: String,
    },
    technologies: {
      type: [String],
    },
    githubUrl: {
      type: String,
    },
    liveUrl: {
      type: String,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    completionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create project slug from the title before save
projectSchema.pre('save', function (next) {
  if (!this.isModified('title')) {
    next();
  }
  this.slug = slugify(this.title, { lower: true });
  next();
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
