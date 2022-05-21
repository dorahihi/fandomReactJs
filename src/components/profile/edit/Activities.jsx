import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setIsReloadProfile } from "../../../features/profileSlice";
import { errorNotify, successNotify } from "../../../util/notification";
import { sendAuthPostResquest } from "../../../util/utils";
import TextEditor from "../../editor/TextEditor";
import style from "./edit.module.css";

const Activities = ({submit, setSubmit, setLoading, setHide}) =>{

    const dispatch = useDispatch();

    const data = useSelector(state => state.profile.profile.activities);
    const [content, setContent] = useState(data);


    useEffect(() =>{
        if(submit){
            save();
        }
    });

    const save = async () =>{
        console.log(content);
        let formData = new FormData();
        formData.append("activities", content);
        let res = await sendAuthPostResquest("/profile/update/activities", formData, "");
        if(res.status === 200){
            dispatch(setIsReloadProfile(true));
            successNotify("Cập nhật thông tin thành công!", "lifeCareer");
            setSubmit(false);
            setLoading(false);
            setHide(true);
        }else{
            errorNotify("Đã có lỗi xảy ra, vui lòng thực hiện lại!");
            setLoading(false);
        }
    }

    return (
        <div className={style.activities}>
            <TextEditor type={"edit"} size="large" data={content} func={setContent}/>
        </div>
    )
}

export default Activities;