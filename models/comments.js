const marked = require('marked');
const Comment = require('../lib/mongo').Comment;

// 将 Comment 的 content 从 markdown 转换成 html
Comment.plugin('contentToHtml',{
    afterFind:comments=>{
        return comments.map(comment=>{
            comment.content = marked(comment.content);
            return comment;
        });
    }
});

module.exports = {
    // 创建一个 留言
    create:function create(comment){
        return Comment.create(comment).exec();
    },
    // 通过yoghurt id 和留言 id  删除一个留言
    delCommentById:function delCommentById(commentId,author){
        return Comment.remove({author:author,_id:commentId}).exec();
    },
    //通过文章 id  删除 该文章下所有留言
    delCommentsByPostId:function delCommentsByPostId(postId){
        return Comment.remove({postId:postId}).exec();
    },
    // 通过文章 id 获取该文章下所有留言，按留言创建顺序升序
    getComments:function getComments(postId){
        return Comment
            .find({postId:postId})
            .populate({path:'author',model:'User'})
            .sort({_id:1})
            .addCreateAt()
            .contentToHtml()
            .exec();
    },
    // 通过文章 id 获取该文章下 留言数
    getCommentsCount:function getCommentsCount(postId){
        return Comment.count({postId:postId}).exec();
    }
};