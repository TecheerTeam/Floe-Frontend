import axios from 'axios';
import { ResponseDto } from './response';
import { PostRecordResponseDto, PutRecordResponseDto, DeleteRecordResponseDto, PostCommentResponseDto, GetCommentResponseDto, DeleteCommentResponseDto, GetRecordResponseDto, GetRecordLikeCountResponseDto, GetRecordLikeListResponseDto } from './response/record';
import { PostCommentRequestDto, PutRecordRequestDto, PostRecordRequestDto } from './request/record';
import { SignInRequestDto, SignUpRequestDto } from './request/auth';
import { SignUpResponseDto } from './response/auth';
import GetDetailRecordResponseDto from './response/record/record.response.dto';
import { GetUserResponseDto } from './response/user';
import { SearchRecordRequestDto } from './request/search';
const DOMAIN = 'http://localhost:8080';
const API_DOMAIN = `${DOMAIN}/api/v1`;


const authorization = (accessToken: string) => {
    return { headers: { Authorization: `Bearer ${accessToken}` } }
};
const SIGN_IN_URL = () => `${API_DOMAIN}/auth/login`;
const SIGN_UP_URL = () => `${API_DOMAIN}/auth/sign-up`;


// 로그인 요청을 보내고 응답에서 'Authorization' 헤더를 추출
export const signInRequest = async (requestBody: SignInRequestDto) => {
    const result = await axios.post(SIGN_IN_URL(), requestBody, { withCredentials: true })
        .then(response => {
            console.log('Response Headers:', response.headers);
            // 응답 헤더에서 'accessToken'과 'refreshToken' 추출
            const accessToken = response.headers['authorization']; // 'authorization'이 맞는지 확인
            const refreshToken = response.headers['authorization-refresh']; // 'auth
            const expirationTime = response.headers['expires'];

            const responseBody = {
                ...response.data, // 기존 응답 데이터
                accessToken,       // 추가된 accessToken
                refreshToken,
                expirationTime      // 추가된 refreshToken
            };

            // 토큰 값이 없으면 실패 처리
            if (!accessToken || !refreshToken) {
                console.error('토큰 정보가 없습니다.');
                return null;  // 또는 error 처리
            }

            return responseBody;
        })
        .catch(error => {
            if (!error.response || !error.response.data) {
                return null;
            }
            const responseBody: ResponseDto = error.response.data;
            console.error('로그인 오류:', responseBody);
            return responseBody;
        });

    return result;
};

export const signUpRequest = async (requestBody: SignUpRequestDto) => {
    const result = await axios.post(SIGN_UP_URL(), requestBody)
        .then(response => {
            const responseBody: SignUpResponseDto = response.data;
            return responseBody;
        })
        .catch(error => {
            if (!error.response.data) return null;
            const responseBody: ResponseDto = error.response.data;
            return responseBody;
        });
    return result;
}

const GET_SIGN_IN_USER_URL = () => `${API_DOMAIN}/users`;
export const getSignInUserRequest = async (accessToken: string) => {
    const result = await axios.get(GET_SIGN_IN_USER_URL(), authorization(accessToken))
        .then(response => {
            const responseBody: GetUserResponseDto = response.data;
            return responseBody;
        })
        .catch(error => {
            if (!error.response) return null;
            const responseBody: ResponseDto = error.response.data;
            return responseBody;
        })
    return result;
}

// 특정 기록 조회
const GET_DETAIL_RECORD_URL = (recordId: number) => `${API_DOMAIN}/records/${recordId}`;
// 전체 기록 조회(최신순 / 홈페이지)
const GET_RECORD_URL = () => `${API_DOMAIN}/records`;
// 기록 생성
const POST_RECORD_URL = () => `${API_DOMAIN}/records`;
// 특정 기록 수정
const PUT_RECORD_URL = (recordId: number) => `${API_DOMAIN}/records/${recordId}`;
// 특정 기록 삭제
const DELETE_RECORD_URL = (recordId: number) => `${API_DOMAIN}/records/${recordId}`;
// 기록 검색 api
const SEARCH_RECORD_URL = () => `${API_DOMAIN}/records/search`;

//          function: 특정 기록 조회 요청 API          //
export const getDetailRecordRequest = async (recordId: number) => {
    const result = await axios.get(GET_DETAIL_RECORD_URL(recordId))
        .then(response => {
            const responseBody: GetDetailRecordResponseDto = response.data;
            return responseBody;
        })
        .catch(error => {
            if (!error.response) return null;
            const responseBody: ResponseDto = error.response.data;
            return responseBody;
        })
    return result;
}
//          function: 전체 기록 조회(최신순 / 홈페이지) 요청 API          //
export const getRecordRequest = async (page: number, size: number): Promise<GetRecordResponseDto> => {
    const response = await axios.get<GetRecordResponseDto>(
        `${GET_RECORD_URL()}?page=${page}&size=${size}`
    );
    return response.data;
};
// export const getSearchRecordRequest = async (searchRequest: SearchRecordRequestDto, page: number, size: number, accessToken: string): Promise<GetRecordResponseDto> => {
//     try {
//         const response = await axios.get<GetRecordResponseDto>(
//             `${SEARCH_RECORD_URL()}?page=${page}&size=${size}`, {
//             headers: {
//                 Authorization: `Bearer ${accessToken}`, // Authorization 헤더 추가
//             },
//         });
//         console.log('search api response ', response);
//         return response.data;
//     }
//     catch (error) {
//         if (axios.isAxiosError(error)) {
//             // Axios 에러라면 response 데이터 확인
//             console.error('Error fetching comments:', error.response?.data || error.message);
//         } else {
//             // 일반적인 에러 메시지 출력
//             console.error('Unknown error:', error);
//         }
//         throw error;
//     }

// };

export const getSearchRecordRequest = async (
    searchRequest: SearchRecordRequestDto,
    page: number,
    size: number,
    accessToken: string
): Promise<GetRecordResponseDto> => {
    try {
        // 쿼리 파라미터 생성
        const params = new URLSearchParams();

        // 필수 파라미터
        params.append('page', page.toString());
        params.append('size', size.toString());

        // 선택적 파라미터 추가 (값이 존재할 때만 추가)
        if (searchRequest.recordType) {
            params.append('recordType', searchRequest.recordType);
        }
        if (searchRequest.title) {
            params.append('title', searchRequest.title);
        }
        if (searchRequest.tagNames && searchRequest.tagNames.length > 0) {
            searchRequest.tagNames.forEach(tag => params.append('tagNames', tag));
        }

        // GET 요청
        const response = await axios.get<GetRecordResponseDto>(
            `${SEARCH_RECORD_URL()}?${params.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`, // Authorization 헤더 추가
                },
            }
        );
        console.log('search api response', response);
        console.log(`Request URL: ${SEARCH_RECORD_URL()}?${params.toString()}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Axios 에러라면 response 데이터 확인
            console.error('Error fetching comments:', error.response?.data || error.message);
        } else {
            // 일반적인 에러 메시지 출력
            console.error('Unknown error:', error);
        }
        throw error;
    }
};


//          function: 기록 생성 요청 API          //

export const postRecordRequest = async (formData: FormData, accessToken: string) => {
    try {
        const result = await axios.post(POST_RECORD_URL(), formData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'multipart/form-data'
            },
        });
        console.log('post ', result);
        return result.data;
    } catch (error: unknown) {
        // error가 AxiosError인지 확인하고 안전하게 접근
        if (axios.isAxiosError(error)) {
            if (!error.response) return null;
            return error.response.data;
        } else {
            // AxiosError가 아닌 경우 처리
            console.error('An unexpected error occurred:', error);
            return null;
        }
    }
};


//          function: 특정 게시물 수정 요청 API          //
export const putRecord = async (recordId: number, requestBody: PutRecordRequestDto, accessToken: string) => {
    const result = await axios.post(PUT_RECORD_URL(recordId), requestBody, authorization(accessToken))
        .then(response => {
            const responseBody: PutRecordResponseDto = response.data;
            return responseBody;
        })
        .catch(error => {
            if (!error.response) return null;
            const responseBody: ResponseDto = error.response.data;
            return responseBody;
        })
    return result;
}

//          function: 특정 기록 삭제 요청 API          //
export const deleteRecord = async (recordId: number, accessToken: string) => {
    const result = await axios.post(DELETE_RECORD_URL(recordId), authorization(accessToken))
        .then(response => {
            const responseBody: DeleteRecordResponseDto = response.data;
            return responseBody;
        })
        .catch(error => {
            if (!error.response) return null;
            const responseBody: ResponseDto = error.response.data;
            return responseBody;
        })
    return result;
}

// 댓글 작성
const POST_COMMENT_URL = () => `${API_DOMAIN}/comments`;
// 댓글 수정
const PUT_COMMENT_URL = (recordId: number | string) => `${API_DOMAIN}/comments/${recordId}`;
// 댓글 조회
const GET_COMMENT_URL = (recordId: number) => `${API_DOMAIN}/comments/${recordId}`;
// 대대댓글 조회
const GET_REPLY_URL = (commentId: number) => `${API_DOMAIN}/comments/${commentId}/replies`;
// 댓글 삭제
const DELETE_COMMENT_URL = (recordId: number, commentId: number | string) => `${API_DOMAIN}/comments/${recordId}/${commentId}`;

//          function: 댓글 작성 요청 API          //
export const postCommentRequest = async (requestBody: PostCommentRequestDto, accessToken: string) => {
    try {
        const response = await axios.post(POST_COMMENT_URL(), requestBody, authorization(accessToken));
        return response.data;
    } catch (error: unknown) {
        // error가 AxiosError인지 확인하고 안전하게 접근
        if (axios.isAxiosError(error)) {
            if (!error.response) return null;
            return error.response.data;
        } else {
            // AxiosError가 아닌 경우 처리
            console.error('An unexpected error occurred:', error);
            return null;
        }
    }
}
//          function: 댓글 조회 요청 API  토큰X        //
// export const getCommentRequest = async (recordId: number, page: number, size: number): Promise<GetCommentResponseDto> => {
//     const response = await axios.get<GetCommentResponseDto>(
//         `${GET_COMMENT_URL(recordId)}?page=${page}&size=${size}`
//     );
//     console.log('ddd', response)
//     return response.data;

// };
//          function: 댓글 조회 요청 API  토큰O        //
export const getCommentRequest = async (recordId: number, page: number, size: number, accessToken: string): Promise<GetCommentResponseDto> => {
    try {
        const response = await axios.get<GetCommentResponseDto>(
            `${GET_COMMENT_URL(recordId)}?page=${page}&size=${size}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`, // Authorization 헤더 추가
                },
            }
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Axios 에러라면 response 데이터 확인
            console.error('Error fetching comments:', error.response?.data || error.message);
        } else {
            // 일반적인 에러 메시지 출력
            console.error('Unknown error:', error);
        }
        throw error;
    }
};
export const getReplyRequest = async (commentId: number, page: number, size: number, accessToken: string): Promise<GetCommentResponseDto> => {
    try {
        const response = await axios.get<GetCommentResponseDto>(
            `${GET_REPLY_URL(commentId)}?page=${page}&size=${size}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`, // Authorization 헤더 추가
                },
            }
        );
        console.log('reply API Response:', response); // 응답 전체 확인
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Axios 에러라면 response 데이터 확인
            console.error('Error fetching comments:', error.response?.data || error.message);
        } else {
            // 일반적인 에러 메시지 출력
            console.error('Unknown error:', error);
        }
        throw error;
    }
};
//          function: 댓글 수정 요청 API          //
// export const putComment = async (recordId: number | string, commentId: number | string, requestBody: PostCommentRequestDto, accessToken: string) => {
//     const result = await axios.post(PUT_COMMENT_URL(recordId, commentId), requestBody, authorization(accessToken))
//         .then(response => {
//             const responseBody: PostCommentResponseDto = response.data;
//             return responseBody;
//         })
//         .catch(error => {
//             if (!error.response) return null;
//             const responseBody: ResponseDto = error.response.data;
//             return responseBody;
//         })
//     return result;
// }





// //          function: 댓글 삭제 요청 API          //
// export const deleteComment = async (recordId: number | string, commentId: number | string, accessToken: string) => {
//     const result = await axios.post(DELETE_COMMENT_URL(recordId, commentId), authorization(accessToken))
//         .then(response => {
//             const responseBody: DeleteCommentResponseDto = response.data;
//             return responseBody;
//         })
//         .catch(error => {
//             if (!error.response) return null;
//             const responseBody: ResponseDto = error.response.data;
//             return responseBody;
//         })
//     return result;
// }

// // 대댓글 작성
// const POST_REPLY_URL = (recordId: number | string, commentId: number | string) => `${API_DOMAIN}/records/${recordId}/comments/${commentId}/replies`;
// // 대댓글 수정
// const PUT_REPLY_URL = (recordId: number | string, commentId: number | string, replyId: number | string) => `${API_DOMAIN}/records/${recordId}/comments/${commentId}/replies/${replyId}`;

// //          function: 대댓글 작성 요청 API          //
// export const postReply = async (recordId: number | string, commentId: number | string, requestBody: PostCommentRequestDto, accessToken: string) => {
//     const result = await axios.post(POST_REPLY_URL(recordId, commentId), requestBody, authorization(accessToken))
//         .then(response => {
//             const responseBody: PostCommentResponseDto = response.data;
//             return responseBody;
//         })
//         .catch(error => {
//             if (!error.response) return null;
//             const responseBody: ResponseDto = error.response.data;
//             return responseBody;
//         })
//     return result;
// }
// //          function: 대댓글 수정 요청 API          //
// export const putReply = async (recordId: number | string, commentId: number | string, replyId: number | string, requestBody: PostCommentRequestDto, accessToken: string) => {
//     const result = await axios.put(PUT_REPLY_URL(recordId, commentId, replyId), requestBody, authorization(accessToken))
//         .then(response => response.data)
//         .catch(error => {
//             if (!error.response) return null;
//             return error.response.data;
//         });
//     return result;
// };
// 유저 정보 조회

//         좋아요 추가 API         //
const POST_LIKE_URL = (recordId: number) => `${API_DOMAIN}/records/${recordId}/likes`;
//         좋아요 수 조회 API         //
const GET_LIKE_COUNT_URL = (recordId: number) => `${API_DOMAIN}/records/${recordId}/likes`;
//         좋아요 유저 리스트 조회 API          //
const GET_LIKE_LIST_URL = (recordId: number) => `${API_DOMAIN}/records/${recordId}/like-list`;

const DELETE_LIKE_URL = (recordId: number) => `${API_DOMAIN}/records/${recordId}/likes`;
//         function: 좋아요 추가 API         //
export const postLikeRequest = async (recordId: number, accessToken: string) => {
    try {
        const response = await axios.post(POST_LIKE_URL(recordId), {}, authorization(accessToken))
        console.log('post like request api response', response);
        return response;
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            // Axios 에러라면 response 데이터 확인
            console.error('Error fetching comments:', error.response?.data || error.message);
        } else {
            // 일반적인 에러 메시지 출력
            console.error('Unknown error:', error);
        }
        throw error;
    }
}

//         function: 좋아요 수 조회 API         //
export const getLikeCountRequest = async (recordId: number, accessToken: string) => {
    try {
        const response = await axios.get<GetRecordLikeCountResponseDto>(
            `${GET_LIKE_COUNT_URL(recordId)}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`, // Authorization 헤더 추가
            }
        }
        )
        console.log('get Like Count API Response:', response); // 응답 전체 확인
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Axios 에러라면 response 데이터 확인
            console.error('Error fetching comments:', error.response?.data || error.message);
        } else {
            // 일반적인 에러 메시지 출력
            console.error('Unknown error:', error);
        }
        throw error;
    }
};

//         function: 좋아요 리스트 조회 API          //
export const getLikeListRequest = async (recordId: number, accessToken: string) => {
    try {
        const response = await axios.get<GetRecordLikeListResponseDto>(
            `${GET_LIKE_LIST_URL(recordId)}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`, // Authorization 헤더 추가
            }
        }
        )
        console.log('get Like List API Response:', response); // 응답 전체 확인
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Axios 에러라면 response 데이터 확인
            console.error('Error fetching comments:', error.response?.data || error.message);
        } else {
            // 일반적인 에러 메시지 출력
            console.error('Unknown error:', error);
        }
        throw error;
    }
};
//         function: 좋아요 삭제 API          //
export const deleteLikeRequest = async (recordId: number, accessToken: string) => {
    try {
        const response = await axios.delete(DELETE_LIKE_URL(recordId), authorization(accessToken))
        console.log('delete like request api response', response);
        return response;
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            // Axios 에러라면 response 데이터 확인
            console.error('Error fetching comments:', error.response?.data || error.message);
        } else {
            // 일반적인 에러 메시지 출력
            console.error('Unknown error:', error);
        }
        throw error;
    }
}
const GET_USER_URL = () => `${API_DOMAIN}/users/`;

export const getUserRequest = async (accessToken: string) => {
    const result = await axios
        .get(GET_USER_URL(), {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
            const responseBody: GetUserResponseDto = response.data;
            return responseBody;
        })
        .catch((error) => {
            if (!error.response) return null;
            const responseBody: ResponseDto = error.response.data;
            return responseBody;
        });

    return result;
};
