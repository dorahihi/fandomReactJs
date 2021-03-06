import style from "./post.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTrash, faMessage, faLockOpen, faCheckCircle, faSquarePen, faBan, faFaceGrinSquint, faFaceMehBlank, faFaceGrinHearts, faFaceKissWinkHeart, faFaceFlushed, faRocket, faBullhorn, faReply, faCircleChevronLeft } from "@fortawesome/free-solid-svg-icons"
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getData, isLoggedIn } from "../../util/localStorage";
import { sendAuthGetRequest, sendAuthPostResquest, sendGetRequest } from "../../util/utils";
import { errorNotify, successNotify, warningNotify } from "../../util/notification";
import { useDispatch } from "react-redux";
import { removeFromPostLoading, removePostFromLocked, removePostFromPending, setPostIsReload } from "../../features/postSlice";
import LockForm from "../basics/LockForm";
import DeleteForm from "../basics/DeleteForm";
import { Idle } from "../../util/requestState";
import { deleteComment, setCommentReload } from "../../features/commentSlice";

const PostFuncBar = ({ isViewed = false, type , author, targetId = "", func}) =>{

    const [upvote, setUpvote] = useState(0);
    const [downvote, setDownvote] = useState(0);
    const [comment, setComment] = useState(0);

    const[showLockForm, setShowLockForm] = useState(false);
    const[showDeleteForm, setShowDeleteForm] = useState(false);

    const [userInteraction, setUserInteraction] = useState("NOINTERACTION");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    let user = JSON.parse(getData("user"));
    if(!user) user = {account: ""};

    useEffect(() =>{
        if(type !== "pending_post" && type !=="locked_post"){
            if(user){
                getUserInteraction();
            }
            getInteractionCount();
            getCommentCount();
        }
        
    }, [])

    useEffect(() => {
        //console.log(showLockForm);
    })

    const getInteractionCount = async () =>{
        let res = await sendGetRequest(`/interaction/count/${targetId}`);
        //console.log(res);
        if(res.status === 200){
            setUpvote(res.data.upvote);
            setDownvote(res.data.downvote);
        }
    }

    const getCommentCount = async () =>{
        let res = await sendGetRequest(`/comment/count/${targetId}`);
        if(res.status === 200){
            setComment(res.data);
        }
    }

    const getUserInteraction = async () =>{
        let res = await sendGetRequest(`/interaction/user/${user.account}/${targetId}`);
        if(res.status === 200){
            setUserInteraction(res.data.type);
        }else{
            setUserInteraction("NOINTERACTION");
        }
    }

    const upvoteClickHanlde = async () =>{
        if(isLoggedIn()){
            
            if(JSON.parse(getData("user")).status === "BANNED"){
                warningNotify("T??i kho???n c???a b???n ???? b??? kho?? n??n kh??ng th???c hi???n ???????c h??nh ?????ng n??y");
                return;
            }
            let formData = new FormData();
            formData.append("account", user.account);
            formData.append("targetId", targetId);
            let res = await sendAuthPostResquest("/interaction/upvote", formData);
            if(res.status === 200){
                if(userInteraction === "UPVOTE"){
                    setUserInteraction("NOINTERACTION");
                    setUpvote(upvote - 1);
                } else if(userInteraction === "DOWNVOTE"){
                    setUserInteraction("UPVOTE");
                    setDownvote(downvote - 1);
                    setUpvote(upvote + 1);
                }
                else{
                    setUserInteraction("UPVOTE");
                    setUpvote(upvote + 1);
                }
            }
        }else{
            warningNotify("B???n c???n ????ng nh???p ????? th???c hi???n h??nh ?????ng n??y!")
        }
    }

    const reply = () =>{
        
        if(JSON.parse(getData("user")).status === "BANNED"){
            warningNotify("T??i kho???n c???a b???n ???? b??? kho?? n??n kh??ng th???c hi???n ???????c h??nh ?????ng n??y");
            return;
        }
        func();
    }

    const downvoteClickHandle = async () =>{
        if(isLoggedIn()){
            if(JSON.parse(getData("user")).status === "BANNED"){
                warningNotify("T??i kho???n c???a b???n ???? b??? kho?? n??n kh??ng th???c hi???n ???????c h??nh ?????ng n??y");
                return;
            }
            let formData = new FormData();
            formData.append("account", user.account);
            formData.append("targetId", targetId);
            let res = await sendAuthPostResquest("/interaction/downvote", formData);
            if(res.status === 200){
                if(userInteraction === "DOWNVOTE"){
                    setUserInteraction("NOINTERACTION");
                    setDownvote(downvote - 1);
                }else if(userInteraction === "UPVOTE"){
                    setUserInteraction("DOWNVOTE");
                    setUpvote(upvote - 1);
                    setDownvote(downvote + 1);
                }
                else{
                    setUserInteraction("DOWNVOTE");
                    setDownvote(downvote + 1);
                }
            }
        }else{
            warningNotify("B???n c???n ????ng nh???p ????? th???c hi???n h??nh ?????ng n??y!")
        }
    }

    const editPost = () =>{
        navigate(`/post/edit/${targetId}`);
    }

    const approve = async () =>{
        let res = await sendAuthPostResquest(`/post/approval/${targetId}`, "");
        if(res.status === 200){
            successNotify("B??i vi???t ???? ???????c duy???t!");
            dispatch(removePostFromPending(targetId));
            dispatch(setPostIsReload(true));
        }else{
            errorNotify("???? c?? l???i x???y ra.");
        }
    }

    const deletePost = async (msg) =>{
        let data = new FormData();
        data.append("postId", targetId);
        data.append("note", msg);

        let res = await sendAuthPostResquest(`/post/delete`, data);
        if(res.status === 200){
            successNotify("B??i vi???t ???? ???????c xo??!")
            if(type === "pending_post")
                dispatch(removePostFromPending(targetId));
            if(type === "locked_post")
                dispatch(removePostFromLocked(targetId)); 

            dispatch(setPostIsReload(true));
        }else{
            errorNotify("???? c?? l???i x???y ra.");
        }
    }


    //d??ng trong trang b??i vi???t ch??? c???a admin
    const lockPost = async (msg) =>{
        let data = new FormData();
        data.append("postId", targetId);
        data.append("note", msg);
        let res = await sendAuthPostResquest(`/post/locked`, data);
        if(res.status === 200){
            successNotify("B??i vi???t ???? b??? kho??!")
            dispatch(removeFromPostLoading(targetId));
            dispatch(setPostIsReload(true));
            navigate("/");
        }else{
            errorNotify("???? c?? l???i x???y ra.");
        }
    }

    const openDeleteForm = () =>{
        
        if(JSON.parse(getData("user")).status === "BANNED"){
            warningNotify("T??i kho???n c???a b???n ???? b??? kho?? n??n kh??ng th???c hi???n ???????c h??nh ?????ng n??y");
            return;
        }
        let user = JSON.parse(getData("user")); 
        if(user.account === author){
            setShowDeleteForm(true);
        }else if(user.role === "ADMIN"){
            setShowLockForm(true);
        }
    }

    const deleteCommentFunc = async (msg) =>{
        console.log(targetId + "   " + msg);
        let data = new FormData();
        data.append("id", targetId);
        let res = await sendAuthPostResquest("/comment/delete", data, "");
        if(res.status === 200){
            dispatch(deleteComment(targetId));
            dispatch(setCommentReload(true));
        }
    }

    const getContent = () =>{
        if(type === "normal_post") {
            return(
                <div className={style.postFuncBar}>
                    <DeleteForm type="comment" showing={showDeleteForm} msg="B??? xo?? b???i ng?????i d??ng" closeFunc={setShowDeleteForm} deleteFunc={deleteCommentFunc}/>
                    <LockForm func={lockPost} showing={showLockForm} setShowing={setShowLockForm}/>
                    <div title="Tuy???t v???i!!" onClick={upvoteClickHanlde}  className={style.upVote + " " +(userInteraction === "UPVOTE"? style.upVoteActive : "")}>
                        <FontAwesomeIcon icon={faFaceKissWinkHeart} />
                        <div>{upvote === 0? "":upvote}</div>
                    </div>
                    <div title=":((" onClick={downvoteClickHandle} className={style.downVote  + " " +(userInteraction === "DOWNVOTE"? style.downVoteActive : "")}>
                        <FontAwesomeIcon icon={faFaceFlushed} />
                        <div>{downvote === 0? "": downvote}</div>
                    </div>
                    <div  title="B??nh lu???n">
                    {isViewed? 
                        <>
                            <div></div>
                        </>:                        
                        <Link to={"/post/comment/"+targetId}>
                            <FontAwesomeIcon icon={faMessage} />
                            <div>{comment === 0? "": comment}</div>
                        </Link>}
                    </div>
                    
                    {user.account === author? 
                        <div onClick={editPost} title={"Ch???nh s???a b??i vi???t"}>
                            <FontAwesomeIcon icon={faSquarePen} />
                        </div> : <div></div>}
                    {user.role === "ADMIN"?
                        <div onClick={e => setShowLockForm(true)} title="Kho?? b??i vi???t">
                              <FontAwesomeIcon icon={faBan} />
                        </div> : <div></div>}
                </div>
            )
        }

        if(type === "normal_comment" || type === "sub_comment"){
            return (
                <div className={style.postFuncBar}>
                    <DeleteForm type="comment" showing={showDeleteForm} msg="B??? xo?? b???i ng?????i d??ng" closeFunc={setShowDeleteForm} deleteFunc={deleteCommentFunc}/>
                    <LockForm func={deleteCommentFunc} showing={showLockForm} setShowing={setShowLockForm}/>
                    <div title="Tuy???t v???i!!" onClick={upvoteClickHanlde}  className={style.upVote + " " +(userInteraction === "UPVOTE"? style.upVoteActive : "")}>
                        <FontAwesomeIcon title="Tuy???t v???i!!"  icon={faFaceKissWinkHeart} />
                        <div>{upvote === 0? "":upvote}</div>
                    </div>
                    <div title=":((" onClick={downvoteClickHandle} className={style.downVote  + " " +(userInteraction === "DOWNVOTE"? style.downVoteActive : "")}>
                        <FontAwesomeIcon title=":((" icon={faFaceFlushed} />
                        <div>{downvote === 0? "": downvote}</div>
                    </div>
                    {type === "sub_comment" || !isLoggedIn()? <div></div>:
                    <div onClick={reply} title="Tr??? l???i">                    
                        <>
                            <FontAwesomeIcon title="Tr??? l???i" icon={faReply} />
                        </>
                    </div>
                    }
                    {user.account === author? 
                        <div title={"Ch???nh s???a b??nh lu???n"}>
                            <FontAwesomeIcon title={"Ch???nh s???a b??nh lu???n"} icon={faSquarePen} />
                        </div> : <div></div>}
                    {user.role === "ADMIN" || author === user.account ?
                        <div  onClick={openDeleteForm} title={"Xo?? b??nh lu???n"}>
                            <FontAwesomeIcon title={"Xo?? b??nh lu???n"} icon={faTrash} />
                        </div> :
                        <div></div>}
                </div>
            )
        }
    
    }

    return (
        <>
            {getContent()}
        </>
    )

}

export default PostFuncBar;