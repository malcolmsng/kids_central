import { createStore } from "vuex";
import router from "../router";
import { auth, db, storage } from "../firebase.js";
import createPersistedState from "vuex-persistedstate";
import {
  doc,
  updateDoc,
  setDoc,
  getDocs,
  getDoc,
  addDoc,
  collection,
  arrayUnion,
  query,
  where,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { vuexfireMutations } from "vuexfire";
import { uploadBytes, getDownloadURL, ref } from "firebase/storage";
import { ElMessage } from "element-plus";

export default createStore({
  plugins: [createPersistedState()],
  //access state using this.$store.state.<stateVariableName>
  state: {
    user: null,
    userModel: null,
  },
  mutations: {
    ...vuexfireMutations,
    SET_USER(state, user) {
      state.user = user;
    },
    SET_USER_MODEL(state, userModel) {
      state.userModel = userModel;
    },
    CLEAR_USER(state) {
      state.user = null;
    },
    CLEAR_USER_MODEL(state) {
      state.userModel = null;
    },
  },

  //to use getters call store.getters.<getterName>
  getters: {
    getName(state) {
      return state.userModel.name;
    },
    getType(state) {
      return state.userModel.type;
    },
  },
  //HOW TO USE ACTIONS example:
  //in <script>:
  //  methods; {
  // ...mapActions({<name that you give the action (shouldnt have in "")> : "getStudentsInClass"})
  //}
  // in a function --> call this.<givenActionName>(parameters in object form)
  // in <template>:
  // <button @click = "name_given(parameters(i will comment the parameters needed))"></button>
  actions: {
    //RETURNS A LIST OF STUDENTS IN {CLASSNAME}
    async getStudentsInClass(context, className) {
      //console.log(password)
      const studentsList = [];
      console.log(context);
      const classRef = collection(db, "classes", className, "students");
      const classSnap = await getDocs(classRef);
      console.log(classSnap.docs);
      //console.log(classSnap.)
      //const classesCollection = await getDocs(collection(db, "classes"))
      classSnap.forEach((e) => {
        const x = e.data();
        studentsList.push(x);
      });

      return studentsList;
    },

    async login({ commit }, details) {
      const { email, password } = details;
      console.log(details);

      if (email.trim().length == 0 || password.trim().length == 0) {
        ElMessage.error("Please fill in all fields");
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, email, password);

        console.log(user);
      } catch (err) {
        switch (err.code) {
          case "auth/user-not-found":
            ElMessage.error("Invalid username. Please try again.");
            break;
          case "auth/wrong-password":
            ElMessage.error("Invalid Password. Please try again.");
            break;
          default:
            ElMessage.error("Something went wrong! Please try again.");
            break;
        }
        return;
      }
      const userRef = doc(db, "users", auth.currentUser.uid);
      const user = await getDoc(userRef);

      //console.log(user.data())
      commit("SET_USER_MODEL", user.data());
      console.log(user.data());
      commit("SET_USER", auth.currentUser);

      router.push("/home");
    },

    async registerParent({ commit }, details) {
      const { email, password, last, first, parentId } = details;
      const idRefs = collection(db, "parentID");
      var idList = [];
      var docList = [];
      var idIndex = -1;
      var docId = "";

      const querySnapshot = await getDocs(idRefs);
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        idList.push(doc.data()["parentId"]);
        docList.push(doc);
        console.log(doc.id, " => ", doc.data());
      });
      //if id not in list
      if (!idList.includes(parentId)) {
        alert("Not Verified Parent");
        return;
      } else {
        idIndex = idList.indexOf(parentId);
        if (docList[idIndex].data()["activated"] == "true") {
          alert("Parent ID already registered, nice try.");
          return;
        }
        docId = docList[idIndex].id;
        await setDoc(doc(db, "parentID", docId), {
          parentId: parentId,
          activated: "true",
        });
      }
      //   const activatedSnapshot = await getDocs(activatedRef);
      //   activatedSnapshot.forEach((doc) => {
      //     // doc.data() is never undefined for query doc snapshots

      //     updateDoc(doc, { activated: "true" });
      //   });
      // }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        switch (error.code) {
          case "auth/email-already-in-use":
            alert(error.code);
            break;
          case "auth/invalid-email":
            alert("Invalid Email");
            break;
          case "auth/weak-password":
            alert("Weak password");
            break;

          default:
            alert("Something went wrong");
            break;
        }
        return;
      }
      const uid = auth.currentUser.uid;
      const user = {
        email: email,
        password: password,
        first: first,
        last: last,
        parentId,
        type: "parent",
      };

      // const child = {
      //   childName: childName,
      //   childID: childID,
      // };

      // await setDoc(doc(db, "classes", childClass, "students", childID), child);

      await setDoc(doc(db, "users", uid), user);

      commit("SET_USER", auth.currentUser);

      commit("SET_USER_MODEL", user);

      router.push("/home");
    },
    async registerTeacher({ commit }, details) {
      const { email, password, last, first, teacherID, teacherClass } = details;
      const idRefs = collection(db, "teacherID");
      var idList = [];
      var docList = [];
      var idIndex = -1;
      var docId = "";

      const querySnapshot = await getDocs(idRefs);
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        idList.push(doc.data()["teacherId"]);
        docList.push(doc);
        console.log(doc.id, " => ", doc.data());
      });
      //if id not in list
      if (!idList.includes(teacherID)) {
        alert("Not Verified Teacher");
        return;
      } else {
        idIndex = idList.indexOf(teacherID);
        if (docList[idIndex].data()["activated"] == "true") {
          alert("Teacher ID already registered, nice try.");
          return;
        }
        docId = docList[idIndex].id;
        await setDoc(doc(db, "teacherID", docId), {
          teacherId: teacherID,
          activated: "true",
        });
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        switch (error.code) {
          case "auth/email-already-in-use":
            alert(error.code);
            break;
          case "auth/invalid-email":
            alert("Invalid Email");
            break;
          case "auth/weak-password":
            alert("Weak password");
            break;

          default:
            alert("Something went wrong");
            break;
        }
        return;
      }
      const uid = auth.currentUser.uid;
      const user = {
        email: email,
        password: password,
        first: first,
        last: last,
        type: "teacher",
        teacherID: teacherID,
        teacherClass: teacherClass,
      };

      //creating user document
      const ref = await setDoc(doc(db, "users", uid), user);
      console.log(ref);

      commit("SET_USER", auth.currentUser);

      commit("SET_USER_MODEL", user);

      router.push("/home");
    },

    async logout({ commit }) {
      await signOut(auth);
      commit("CLEAR_USER");
      commit("CLEAR_USER_MODEL");
      router.push("/login");
    },

    fetchUser({ commit }) {
      auth.onAuthStateChanged(async (user) => {
        if (user === null) {
          commit("CLEAR_USER");
        } else {
          commit("SET_USER", user);
          if (router.isReady() && router.currentRoute.value.path === "/login") {
            router.push("/home");
          }
        }
      });
    },
    // get user class from parent email
    async getChildClass({ context }, pEmail) {
      const children = [];

      const q = query(
        collection(db, "students"),
        where("parentEmail", "==", pEmail)
      );
      const querySnap = await getDocs(q);
      querySnap.forEach((doc) => {
        children.push(doc.data());
      });
      return children[0]["Class"];
    },

    async getChildClasses({ context }, pEmail) {
      const children = [];
      const classes = [];
      const q = query(
        collection(db, "students"),
        where("parentEmail", "==", pEmail)
      );
      const querySnap = await getDocs(q);
      querySnap.forEach((doc) => {
        children.push(doc.data());
      });
      children.forEach((child) => {
        classes.push(child["Class"]);
      });
      var uniqueClasses = [];
      for (var i = 0; i < classes.length; i++) {
        if (uniqueClasses.indexOf(classes[i]) === -1) {
          uniqueClasses.push(classes[i]);
        }
      }
      return uniqueClasses;
    },

    //getting list of posts
    async getPosts({ context }) {
      const postsList = [];
      console.log(context);
      const postsRef = collection(db, "posts");
      const postSnap = await getDocs(postsRef);
      // console.log(postSnap.docs);
      //console.log(classSnap.)
      //const classesCollection = await getDocs(collection(db, "classes"))
      postSnap.forEach((e) => {
        const x = e.data();
        postsList.push(x);
      });
      return postsList;
    },

    async getForumPosts({ dispatch }, className) {
      const postsList = [];

      const postsRef = collection(db, "forumposts");
      const postSnap = await getDocs(postsRef);

      postSnap.forEach((e) => {
        const x = e.data();
        const id = e.id;
        x["fpid"] = id;
        postsList.push(x);
      });

      const filteredPosts = postsList
        .filter((post) => post.class == className)
        .sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });

      return filteredPosts;
    },

    async getReplies({ context }, fpid) {
      var repliesList = [];

      const postRef = doc(db, "forumposts", fpid);
      const postSnap = await getDoc(postRef);
      repliesList = postSnap.data()["replies"];
      const replies = repliesList.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
        // earliest to latest reply
      });
      return replies;
    },

    async getUsers({ context }, className) {
      const teachersList = [];
      const usersRef = collection(db, "users");
      const userSnap = await getDocs(usersRef);
      userSnap.forEach((e) => {
        const x = e.data();
        teachersList.push(x);
      });
      const teachersInClass = teachersList.filter(
        (user) => user.teacherClass == className
      );

      const parentsList = [];
      const usersRef1 = collection(db, "students");
      const userSnap1 = await getDocs(usersRef1);
      userSnap1.forEach((e) => {
        const x = e.data();
        parentsList.push(x);
      });
      const parentsInClass = parentsList.filter(
        (user) => user.Class == className
      );
      return teachersInClass.concat(parentsInClass);
    },

    async getChildName({ context }, childID) {
      console.log("child method got")
      let childName = [];
      const q = query(
        collection(db, "students"),
        where("childID", "==", childID))
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        childName.push(doc.data().childName)
        console.log(childName)
      });
      return childName[0];
    },

    //CREATING NON FORUM POST USE THIS
    async createPost({ context }, details) {
      console.log(details);

      let post = {
        location: details.location,
        caption: details.caption,
        imageUrl: null,
        date: details.date,
        poster: details.poster,
        recipient: details.recipient,
      };

      if (details.image == null) {
        uploadPost(post);
      } else {
        console.log("got image");
        console.log(details.image);
        const tempUrl =
          "images/" +
          details.location +
          String(Math.random()) +
          details.image.name;
        const imageRef = ref(storage, tempUrl);
        uploadBytes(imageRef, details.image)
          .then((snapshot) => {
            // Let's get a download URL for the file.
            getDownloadURL(snapshot.ref).then((url) => {
              //set image url here --> insert into post object
              post.imageUrl = url;
              uploadPost(post);
            });
          })
          .catch((error) => {
            console.error("Upload failed", error);
          });
      }

      function uploadPost(post) {
        console.log("call method");
        addDoc(collection(db, "posts"), post)
          .then((response) => {
            console.log(response);
          })
          .catch((err) => {
            console.log(err);
            console.log("Errorr upload post");
          });
      }
    },

    async createPost2({ context }, details) {
      const post = {
        location: details.location,
        caption: details.caption,
        imageUrl: null,
        date: details.date,
        poster: details.poster,
        recipient: details.recipient,
      };
      addDoc(collection(db, "posts"), post)
        .then((response) => {
          console.log(response);
        })
        .catch((err) => {
          console.log(err);
        })
        .catch((error) => {
          console.error("Upload failed", error);
        });
    },

    async createForumPost({ context }, details) {
      console.log(context);
      console.log(details);
      const tempUrl =
        "images/" +
        details.location +
        String(Math.random()) +
        details.image.name;
      const imageRef = ref(storage, tempUrl);
      uploadBytes(imageRef, details.image)
        .then((snapshot) => {
          // Let's get a download URL for the file.
          getDownloadURL(snapshot.ref).then((url) => {
            //set image url here --> insert into post object
            const forumpost = {
              location: details.location,
              title: details.title,
              text: details.text,
              imageUrl: url,
              date: details.time,
              uid: details.uid,
              poster: details.poster,
              class: details.class,
              replies: [],
            };
            addDoc(collection(db, "forumposts"), forumpost)
              .then((response) => {
                console.log(response);
              })
              .catch((err) => {
                console.log(err);
              });
            console.log("File available at", url);
          });
        })
        .catch((error) => {
          console.error("Upload failed", error);
        });
    },

    async createReply({ context }, details) {
      // console.log(context);
      // console.log(details);
      const reply = {
        replycontent: details.replycontent,
        date: details.time,
        uid: details.uid,
        replier: details.replier,
      };

      const replyRef = doc(db, "forumposts", details.fpid);
      await updateDoc(replyRef, {
        replies: arrayUnion(reply),
      });
      console.log("dab");
    },
    async createReport({ context }, details) {
      
      const studentRef = doc(db, "students", details.childID)
      const studentDoc = await getDoc(studentRef)
      const studentName = studentDoc.data()['childName']
      const parentEmail = studentDoc.data()['parentEmail']
      const report = {
        "name" : studentName,
        "parentEmail": parentEmail, 
        childID: details.childID,
        title: details.title,
        category: details.category,
        text: details.text,
        date: details.time,
        uploader: details.uploader,
        uid: details.uid,
      };

     
      addDoc(collection(db, "reports"), report)
        .then((response) => {
          console.log(response);
          console.log(report)
        })
        .catch((err) => {
          console.log(err);
        });
    },

    async createGradebook({ context }, details) {
      console.log("gradebook created")
      const studentRef = doc(db, "students", details.childID)
      const studentDoc = await getDoc(studentRef)
      const studentName = studentDoc.data()['childName']
      const parentEmail = studentDoc.data()['parentEmail']
      const gradebook = {
        "name" : studentName,
        "parentEmail": parentEmail, 
        childID: details.childID,
        childName: details.childName,
        title: details.title,
        score: details.score,
        date: details.date,
        uploader: details.uploader,
        uid: details.uid,
      };
      addDoc(collection(db, "gradebook"), gradebook)
        .then((response) => {
          console.log(response);
        })
        .catch((err) => {
          console.log(err);
        });
    },
  },
});
